+++
title = "libhandy-rs v0.6.0 is out!"
date = 2020-07-09
draft = false

[taxonomies]
categories = ["Rust"]
tags = ["Rust"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++


Recently I kind of took over the maintainership of [libhandy-rs](https://gitlab.gnome.org/World/Rust/libhandy-rs), the Rust bindings of [libhandy](https://gitlab.gnome.org/gnome/libhandy). I have since then been preparing for a new release so that Rust & GTK app developers can update to the [latest gtk-rs release](https://gtk-rs.org/blog/2020/07/04/new-release.html) as soon as possible. I also heavily depend on it on my various little apps.

The latest release which targets libhandy-0.0 v0.0.13 features various improvements:

- Proper [documentation](https://world.pages.gitlab.gnome.org/Rust/libhandy-rs/libhandy/) support, note that the docs are built from the main branch

- Builders support

- Generate more missing bindings

- Starting from this release, libhandy-rs have a `libhandy::init()` which should be called right after `gtk::init()`

The next release of libhandy-rs will be targeting libhandy-1 and will hopefully adds the latest missing bits for a complete Rust bindings of libhandy.

A big thanks to the GTK-rs community, I learned so much stuff by contributing :)