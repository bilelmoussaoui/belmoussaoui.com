+++
title = "Trying out Zola"
date = 2022-10-10
draft = false

[taxonomies]
categories = ["Web", "Rust", "Updates"]
tags = ["Web", "Rust"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

For nearly two years I have been inactive on my blog despite spending time making a *fancy* website, but  I can no longer afford the extra code to maintain and infrastructure work to keep it running. So I decided to move the posts I had on the old website to a statically generated one while waiting for the CI to pass during the [gtk-rs hackfest](https://wiki.gnome.org/Hackfests/Rust2022).

One of the annoyances I had with static websites generators is that they were too slow. Add to that [Jekyll](https://jekyllrb.com/) is written in Ruby and it was too difficult to get any `rubygem` installed on my machine.

## Enters Zola

Per the project description, [Zola](https://www.getzola.org/) is a "A fast static site generator in a single binary with everything built-in".

### Installation

The installation process is pretty easy using `cargo` 

```bash
cargo install zola
```

You could also use the pre-built binaries if you want to avoid waiting a bit of time for everything to compile locally, see <https://www.getzola.org/documentation/getting-started/installation/>.

Once Zola is installed, you can initialize a new project:

```bash
zola init my-new-blog
```

To run the web server and test your changes:

```bash
zola serve
```

Then you either have the choice to write your template/theme based on your needs or if you want something that just works like me, you will probably be served by <https://www.getzola.org/themes/>.


### Writing process

That would depend on the theme you ended up picking, in the case of [Serene](https://github.com/isunjn/serene), all I had to do is create a `blog` directory inside `content` and add a `markdown` file for each post.

A very helpful feature I noticed while porting my articles to `markdown`, that validates all the links on your posts is

```bash
zola check
```

### Publishing

The simplest way of publishing a static website nowadays is to use something like Github/Gitlab Pages. The documentation got you covered as they include the `yaml` receipe for the popular services out there <https://www.getzola.org/documentation/deployment/overview/>.

Although, when using the Github receipe, it seems there is an error in the documentation and you will have to do the following change for it to work

```diff
-           TOKEN: ${{ secrets.GITHUB_TOKEN }}
+           TOKEN: $GITHUB_ACTOR:${{ secrets.GITHUB_TOKEN }}
```

## Conclusion

As you might have noticed, I managed to migrate all the content I had on the old website a few hours after installing Zola for the first time. The whole process is pretty smooth if you are familiar with static website generators.

If you are looking for a Jekyll/Hugo replacement, I highly recommend you to give Zola a try.
