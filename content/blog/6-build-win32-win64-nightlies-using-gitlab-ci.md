+++
title = "Build win32/win64 nightlies using Gitlab CI"
date = 2019-09-30
draft = false

[taxonomies]
categories = ["GNOME", "CI"]
tags = ["GNOME", "CI"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

A week ago after getting Dia nightlies published on GNOME's new Flatpak nightlies infrastructure I was discussing with Zander Brown, the new maintainer of Dia, of the possibility to publish Windows nightlies through Gitlab the same way we do with Flatpak bundles. A few minutes later I was already trying to cargo-cult what Gedit had to build Windows bundles.

It took me a bit of time to figure out how things work, especially that I wanted to make it easier for you to set up a win32/win64 build for your project without much work and as we already use a CI template for Flatpak builds, I ended up doing something pretty similar, but a bit more complex under the hood.

{{ figure(src="/posts/6-build-win32-win64-nightlies-using-gitlab-ci/Screenshot-from-2019-09-30-05-22-58.png", caption="Gitlab CI buildings Win32/Win64 bundles") }}

![CI Artifacts](/posts/6-build-win32-win64-nightlies-using-gitlab-ci/Screenshot-from-2019-09-30-05-41-25.png)

## How it works?

We are using [MinGW](http://www.mingw.org/) (Minimalist GNU Windows) under the hood, we build a "chroot" and install all the basic dependencies. Once that's done, we need to build the application and for that we use a PKGBUILD file which we configure and build to create a package that we installer later on the chroot directory. After that, we remove few unneeded stuff like docs, metainfo, desktop files, unneeded executable files (we still need to improve that) and we have our package ready to pass it to [Wix Toolset](https://wixtoolset.org/) (Windows Installer XML Toolset). Wix Toolset is a pretty complicated thing and I have just put things together to make it work :P It what creates the installer for us, the entry on the start menu and so on. As it's still a WIP project, things might change a bit in the future.

{{ figure(src="/posts/6-build-win32-win64-nightlies-using-gitlab-ci/Screenshot-from-2019-09-30-05-58-35.png", caption="Palette running from a Windows 10 VM on GNOME Boxes") }}

## How to use it on your project?

The current state of the project isn't ready to be used yet, the produced bundles are a bit large and I need to handle the dependencies a bit better. But it should be something like this once released for the public usage:

In order to setup a Gitlab CI that creates a nightly windows bundles for you all you have to do is create a `.gitlab-ci.yml` in the source tree of your project with something equivalent to this

```yaml
include: 'https://gitlab.gnome.org/bilelmoussaoui/win32-ci-template/raw/master/ci-template.yml'

variables:
    GIT_SUBMODULE_STRATEGY: recursive
    APP_NAME: "Palette"
    BIN_NAME: "org.gnome.zbrown.Palette"
    MSI_BUNDLE: "palette.msi"
    MANUFACTURER: "GNOME"
    MESON_ARGS: ""
    VERSION: "0.1"
    DEPENDENCIES: "vala gtk3 gobject-introspection gettext appstream-glib meson ninja"
    ICON_PATH: "data/org.gnome.zbrown.Palette.svg"

win32:
    extends: .win32

win64:
    extends: .win64
```

## The plans

I have a lot of plans to improve this and allow the applications that used/want to ship a windows bundle do that with the less work possible. Here's my roadmap for the first "public" release

- Reduce bundle size

- Correctly handle dependencies

- Use a container to reduce the downloaded packages for each build

Any of this wouldn't be possible without the work from MinGW, Gedit developers/contributors who made the installer in the past and StackOverflow.

Source code: <https://gitlab.gnome.org/bilelmoussaoui/win32-ci-template/>

If you want to help me improve this "faster" you can either buy me a coffee to keep me awake like tonight (it's 6am and still awake) you can do that from here <https://paypal.me/BilalELMoussaoui>

See you soon with more awesome stuff!

![Palette Windows Installer](/posts/6-build-win32-win64-nightlies-using-gitlab-ci/Screenshot-from-2019-09-30-02-46-48.png)
