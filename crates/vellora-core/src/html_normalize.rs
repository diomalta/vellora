//! Browser-compatibility normalization before handing HTML to Blitz.
//!
//! Blitz pre-alpha currently drops anonymous inline fragments when those
//! fragments sit next to a block-flow child. Browsers synthesize anonymous
//! block boxes for those fragments. We make that synthesis explicit in flow
//! containers so the normal Blitz text path receives real block elements to lay
//! out and shape.

use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashSet;

use html5ever::serialize::{serialize, SerializeOpts};
use html5ever::tendril::TendrilSink;
use html5ever::{local_name, ns, parse_document, Attribute, QualName};
use markup5ever_rcdom::{Handle, Node, NodeData, RcDom, SerializableHandle};

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
struct SimpleSelector {
    tag: Option<String>,
    id: Option<String>,
    classes: Vec<String>,
}

#[derive(Default)]
struct BlockSelectors {
    selectors: HashSet<SimpleSelector>,
}

pub fn normalize_table_cell_mixed_flow(html: &str) -> Cow<'_, str> {
    let dom = parse_document(RcDom::default(), Default::default()).one(html);
    let block_selectors = collect_block_selectors(&dom.document);
    let mut changed = false;
    normalize_subtree(&dom.document, &block_selectors, &mut changed);
    if !changed {
        return Cow::Borrowed(html);
    }

    let mut out = Vec::new();
    let serializable = SerializableHandle::from(dom.document.clone());
    serialize(&mut out, &serializable, SerializeOpts::default())
        .expect("serializing normalized HTML should not fail");
    Cow::Owned(String::from_utf8(out).expect("html5ever serializer emits UTF-8"))
}

fn normalize_subtree(node: &Handle, block_selectors: &BlockSelectors, changed: &mut bool) {
    if is_flow_container(node) && has_block_like_child(node, block_selectors) {
        *changed |= wrap_inline_runs_in_blocks(node, block_selectors);
    }

    let children = node.children.borrow().clone();
    for child in children {
        normalize_subtree(&child, block_selectors, changed);
    }
}

fn has_block_like_child(node: &Handle, block_selectors: &BlockSelectors) -> bool {
    node.children
        .borrow()
        .iter()
        .any(|child| is_block_like_element(child, block_selectors))
}

fn wrap_inline_runs_in_blocks(node: &Handle, block_selectors: &BlockSelectors) -> bool {
    let old_children = node.children.borrow().clone();
    let mut new_children = Vec::with_capacity(old_children.len());
    let mut pending = Vec::new();
    let mut pending_has_content = false;
    let mut changed = false;

    for child in old_children {
        if is_block_like_element(&child, block_selectors) {
            flush_inline_run(
                node,
                &mut pending,
                pending_has_content,
                &mut new_children,
                &mut changed,
            );
            pending_has_content = false;
            set_parent(&child, node);
            new_children.push(child);
        } else {
            pending_has_content |= is_meaningful_inline_child(&child);
            pending.push(child);
        }
    }
    flush_inline_run(
        node,
        &mut pending,
        pending_has_content,
        &mut new_children,
        &mut changed,
    );

    if changed {
        *node.children.borrow_mut() = new_children;
    }
    changed
}

fn flush_inline_run(
    parent: &Handle,
    pending: &mut Vec<Handle>,
    pending_has_content: bool,
    out: &mut Vec<Handle>,
    changed: &mut bool,
) {
    if pending.is_empty() {
        return;
    }

    if pending_has_content {
        let wrapper = make_div(parent);
        {
            let mut wrapper_children = wrapper.children.borrow_mut();
            for child in pending.drain(..) {
                set_parent(&child, &wrapper);
                wrapper_children.push(child);
            }
        }
        set_parent(&wrapper, parent);
        out.push(wrapper);
        *changed = true;
    } else {
        for child in pending.drain(..) {
            set_parent(&child, parent);
            out.push(child);
        }
    }
}

fn make_div(parent: &Handle) -> Handle {
    let node = Node::new(NodeData::Element {
        name: QualName::new(None, ns!(html), local_name!("div")),
        attrs: RefCell::new(Vec::<Attribute>::new()),
        template_contents: RefCell::new(None),
        mathml_annotation_xml_integration_point: false,
    });
    set_parent(&node, parent);
    node
}

fn set_parent(child: &Handle, parent: &Handle) {
    child.parent.set(Some(std::rc::Rc::downgrade(parent)));
}

fn is_flow_container(node: &Handle) -> bool {
    let Some(tag) = element_name(node) else {
        return false;
    };
    !matches!(
        tag.as_str(),
        "html"
            | "head"
            | "table"
            | "thead"
            | "tbody"
            | "tfoot"
            | "tr"
            | "colgroup"
            | "col"
            | "script"
            | "style"
            | "template"
    )
}

fn is_meaningful_inline_child(node: &Handle) -> bool {
    match &node.data {
        NodeData::Text { contents } => !contents.borrow().trim().is_empty(),
        NodeData::Comment { .. } => false,
        NodeData::Element { name, .. } => {
            !matches!(name.local.as_ref(), "script" | "style" | "template")
        }
        _ => false,
    }
}

fn is_block_like_element(node: &Handle, block_selectors: &BlockSelectors) -> bool {
    let NodeData::Element { name, attrs, .. } = &node.data else {
        return false;
    };
    let tag = name.local.as_ref().to_ascii_lowercase();
    if is_natural_block_tag(&tag) {
        return true;
    }
    let attrs = attrs.borrow();
    if attrs
        .iter()
        .find(|attr| attr.name.local.as_ref() == "style")
        .is_some_and(|attr| style_declares_display_block(&attr.value))
    {
        return true;
    }
    block_selectors.matches(&tag, &attrs)
}

fn is_natural_block_tag(tag: &str) -> bool {
    matches!(
        tag,
        "address"
            | "article"
            | "aside"
            | "blockquote"
            | "div"
            | "dl"
            | "fieldset"
            | "figcaption"
            | "figure"
            | "footer"
            | "form"
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6"
            | "header"
            | "hr"
            | "main"
            | "nav"
            | "ol"
            | "p"
            | "pre"
            | "section"
            | "table"
            | "ul"
    )
}

fn element_name(node: &Handle) -> Option<String> {
    match &node.data {
        NodeData::Element { name, .. } => Some(name.local.as_ref().to_ascii_lowercase()),
        _ => None,
    }
}

fn collect_block_selectors(document: &Handle) -> BlockSelectors {
    let mut css = String::new();
    collect_style_text(document, &mut css);
    BlockSelectors {
        selectors: parse_display_block_selectors(&css),
    }
}

fn collect_style_text(node: &Handle, css: &mut String) {
    if element_name(node).as_deref() == Some("style") {
        for child in node.children.borrow().iter() {
            if let NodeData::Text { contents } = &child.data {
                css.push_str(&contents.borrow());
                css.push('\n');
            }
        }
        return;
    }

    for child in node.children.borrow().iter() {
        collect_style_text(child, css);
    }
}

fn parse_display_block_selectors(css: &str) -> HashSet<SimpleSelector> {
    let css = strip_css_comments(css);
    let mut selectors = HashSet::new();
    for rule in css.split('}') {
        let Some((selector_text, declarations)) = rule.split_once('{') else {
            continue;
        };
        if !style_declares_display_block(declarations) {
            continue;
        }
        for selector in selector_text.split(',') {
            if let Some(simple) = parse_simple_selector(selector) {
                selectors.insert(simple);
            }
        }
    }
    selectors
}

fn style_declares_display_block(style: &str) -> bool {
    style.split(';').any(|decl| {
        let Some((name, value)) = decl.split_once(':') else {
            return false;
        };
        let value = value.trim();
        let value = value
            .strip_suffix("!important")
            .map(str::trim)
            .unwrap_or(value);
        name.trim().eq_ignore_ascii_case("display") && value.eq_ignore_ascii_case("block")
    })
}

fn strip_css_comments(css: &str) -> String {
    let mut out = String::with_capacity(css.len());
    let mut rest = css;
    while let Some(start) = rest.find("/*") {
        out.push_str(&rest[..start]);
        let after_start = &rest[start + 2..];
        if let Some(end) = after_start.find("*/") {
            rest = &after_start[end + 2..];
        } else {
            return out;
        }
    }
    out.push_str(rest);
    out
}

fn parse_simple_selector(selector: &str) -> Option<SimpleSelector> {
    let compound = selector
        .rsplit(|c: char| c.is_whitespace() || matches!(c, '>' | '+' | '~'))
        .find(|part| !part.trim().is_empty())?
        .trim();
    let compound = compound.split([':', '[']).next().unwrap_or(compound).trim();
    if compound.is_empty() {
        return None;
    }

    let mut tag = None;
    let mut id = None;
    let mut classes = Vec::new();
    let chars: Vec<char> = compound.chars().collect();
    let mut i = 0;
    if chars
        .first()
        .is_some_and(|c| c.is_ascii_alphabetic() || *c == '*')
    {
        let start = i;
        i += 1;
        while i < chars.len() && is_ident_char(chars[i]) {
            i += 1;
        }
        if chars[start] != '*' {
            tag = Some(
                chars[start..i]
                    .iter()
                    .collect::<String>()
                    .to_ascii_lowercase(),
            );
        }
    }

    while i < chars.len() {
        let marker = chars[i];
        if marker != '.' && marker != '#' {
            return None;
        }
        i += 1;
        let start = i;
        while i < chars.len() && is_ident_char(chars[i]) {
            i += 1;
        }
        if start == i {
            return None;
        }
        let value = chars[start..i].iter().collect::<String>();
        if marker == '.' {
            classes.push(value);
        } else {
            id = Some(value);
        }
    }

    if tag.is_none() && id.is_none() && classes.is_empty() {
        return None;
    }
    classes.sort();
    Some(SimpleSelector { tag, id, classes })
}

fn is_ident_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || matches!(c, '-' | '_')
}

impl BlockSelectors {
    fn matches(&self, tag: &str, attrs: &[Attribute]) -> bool {
        if self.selectors.is_empty() {
            return false;
        }
        let id = attrs
            .iter()
            .find(|attr| attr.name.local.as_ref() == "id")
            .map(|attr| attr.value.as_ref());
        let classes: HashSet<&str> = attrs
            .iter()
            .find(|attr| attr.name.local.as_ref() == "class")
            .map(|attr| attr.value.split_whitespace().collect())
            .unwrap_or_default();

        self.selectors.iter().any(|selector| {
            selector.tag.as_deref().is_none_or(|wanted| wanted == tag)
                && selector
                    .id
                    .as_deref()
                    .is_none_or(|wanted| id == Some(wanted))
                && selector
                    .classes
                    .iter()
                    .all(|wanted| classes.contains(wanted.as_str()))
        })
    }
}
