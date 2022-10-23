+++
title = "Making Rust attractive for writing GTK applications"
date = 2022-10-23
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

[Rust](https://www.rust-lang.org/), the programming language, has been gaining traction across many software disciplines - support for it has landed in the [upstream Linux kernel]((https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8aebac82933ff1a7c8eede18cab11e1115e2062b)), developers have been using it for games, websites, low-level OS components, and desktop applications.

The gtk-rs team has been doing an impressive amount of work during the last few years to make the experience of using GObject-based libraries in Rust enjoyable by providing high-quality, memory-safe bindings around those libraries, generated with [gir](https://github.com/gtk-rs/gir) from the [introspection data](https://gi.readthedocs.io/en/latest/).

Approximately two years ago and a few months before the release of [GTK](https://gtk.org/) 4, I decided to take over the maintenance of [gtk4-rs](https://github.com/gtk-rs/gtk4-rs) and push forward the initial work made by Xiang Fan during a Google Summer of Code internship. Nowadays, these are the most used GTK 4 bindings out there with probably more than 100 applications written in it, ranging from simple applications like [Contrast](https://flathub.org/apps/details/org.gnome.design.Contrast) to complex ones like [Telegrand](https://github.com/melix99/telegrand) or [Spot](https://flathub.org/apps/details/dev.alextren.Spot).

In this post, I will talk about the current status and what we have achieved since the first release of `gtk4-rs`.

## Bindings

As mentioned above, a good portion of the bindings is generated automatically using [gir](https://github.com/gtk-rs/gir). But sometimes, a manual implementation is needed, like in the following cases:

- Make the code more Rust idiomatic
- Handling cases that are too specific to be supported by [gir](https://github.com/gtk-rs/gir). e.g, a `x_get_type` function being exposed only in a specific version.
- Writing the necessary infrastructure code to allow developers to create custom GObjects, e.g. custom widgets or GStreamer plugins

Currently, gtk4-rs is composed of ~170 000 lines of code automatically generated and ~26 000 manually written, which is approximately 13% of manual code.

### Subclassing

In the early days of `gtk3-rs`, the infrastructure for writing custom subclassses wasn't fully there yet, especially the amount of manual code that had to be written for supporting all the virtual functions (that can be overridden by a sub-implementation) of `gtk::Widget` was a lot. That caused people to avoid writing custom GTK widgets and do plenty of hacks like having one single `ObjectWrapper` GObject that would serialize a Rust struct into a `JSON` to store it as a string property in order to store these Rust types in a `gio::ListModel` and use it with `gtk::ListBox::bind_model`/`gtk::FlowBox::bind_model`.

Thankfully that is no longer the case for `gtk4-rs` as a huge amount of work went into manually implementing the necessary traits to support almost all of the types that can be subclassed with the exception of `gtk::TreeModel` (which would be deprecated starting from GTK 4.10), see <https://github.com/gtk-rs/gtk4-rs/pull/169> for details why that didn't happen yet.

As more people started writing custom GTK widgets/GStreamer plugins, more people looking into simplifying the whole experience grew.

Creating a very simple and useless custom GTK widget looked like this the days of gtk-rs-core 0.10:
```rust
mod imp {
    pub struct SimpleWidget;

    impl ObjectSubclass for SimpleWidget {
        const NAME: &'static str = "SimpleWidget";
        type ParentType = gtk::Widget;
        type Instance = subclass::simple::InstanceStruct<Self>;
        type Class = subclass::simple::ClassStruct<Self>;

        glib_object_subclass!();

        fn new() -> Self {
            Self
        }
    }

    impl ObjectImpl for SimpleWidget {
        glib_object_impl!();
    }
    impl WidgetImpl for SimpleWidget {}
}
glib::wrapper! {
    pub struct SimpleWidget(ObjectSubclass<imp::SimpleWidget>)
        @extends gtk::Widget;
}
```

Nowadays it looks like this:
```rust
mod imp {
    #[derive(Default)]
    pub struct SimpleWidget;

    #[glib::object_subclass]
    impl ObjectSubclass for SimpleWidget {
        const NAME: &'static str = "SimpleWidget";
        type ParentType = gtk::Widget;
    }

    impl ObjectImpl for SimpleWidget {}
    impl WidgetImpl for SimpleWidget {}
}
glib::wrapper! {
    pub struct SimpleWidget(ObjectSubclass<imp::SimpleWidget>)
        @extends gtk::Widget;
}
```

Of course, the overall code is still a bit too verbose, particularly when you have to define GObject properties. However, people have been experimenting with writing a [derive macro](https://github.com/gtk-rs/gtk-rs-core/pull/494) to simplify the properties declaration part, as well as a [`gobject::class!`](https://github.com/gtk-rs/gtk-rs-core/issues/540) macro for generating most of the remaining boilerplate code. Note, those macros are still experiments and would need more time to mature before eventually getting merged upstream.


### Composite Templates

In short, composite templates allow you to make your custom `GtkWidget` subclass use GTK XML UI definitions for providing the widget structure, splitting the UI code from it logic. The UI part can be either inlined in the code, or written in a separate file, with optional runtime validation using the `xml_validation` feature (unless you are using `GResource`s).

```rust
mod imp {
    #[derive(Default, gtk::CompositeTemplate)]
    #[template(string = r#"
    <interface>
      <template class="SimpleWidget" parent="GtkWidget">
        <child>
          <object class="GtkLabel" id="label">
            <property name="label">foobar</property>
          </object>
        </child>
      </template>
    </interface>
    "#)]
    pub struct SimpleWidget {
        #[template_child]
        pub label: TemplateChild<gtk::Label>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for SimpleWidget {
        const NAME: &'static str = "SimpleWidget";
        type ParentType = gtk::Widget;

        fn class_init(klass: &mut Self::Class) {
            klass.bind_template();
        }

        fn instance_init(obj: &gtk::glib::subclass::InitializingObject<Self>) {
            obj.init_template();
        }
    }

    impl ObjectImpl for SimpleWidget {
        fn dispose(&self) {
            // since gtk 4.8 and only if you are using composite templates
            self.obj().dispose_template(Self::Type);
            // before gtk 4.8, for each direct child widget
            // while let Some(child) = self.obj().first_child() {
            //     child.unparent();
            // }
        }
    }
    impl WidgetImpl for SimpleWidget {}
}
glib::wrapper! {
    pub struct SimpleWidget(ObjectSubclass<imp::SimpleWidget>)
        @extends gtk::Widget;
}
```

Composite templates also allow you to also set a function to be called when a specific signal is emitted:

```rust
mod imp {
    #[derive(Default, gtk::CompositeTemplate)]
    #[template(string = r#"
    <interface>
      <template class="SimpleWidget" parent="GtkWidget">
        <child>
          <object class="GtkButton" id="button">
            <property name="label">Click me!</property>
            <signal name="clicked" handler="on_clicked" swapped="true" />
          </object>
        </child>
      </template>
    </interface>
    "#)]
    pub struct SimpleWidget {
        #[template_child]
        pub label: TemplateChild<gtk::Label>,
    }

    #[glib::object_subclass]
    impl ObjectSubclass for SimpleWidget {
        const NAME: &'static str = "SimpleWidget";
        type ParentType = gtk::Widget;

        fn class_init(klass: &mut Self::Class) {
            klass.bind_template();
            klass.bind_template_instance_callbacks();
        }

        fn instance_init(obj: &gtk::glib::subclass::InitializingObject<Self>) {
            obj.init_template();
        }
    }

    impl ObjectImpl for SimpleWidget {
        fn dispose(&self) {
            // since gtk 4.8 and only if you are using composite templates
            self.obj().dispose_template(Self::Type);
            // before gtk 4.8, for each direct child widget
            // while let Some(child) = self.obj().first_child() {
            //     child.unparent();
            // }
        }
    }
    impl WidgetImpl for SimpleWidget {}
}
glib::wrapper! {
    pub struct SimpleWidget(ObjectSubclass<imp::SimpleWidget>)
        @extends gtk::Widget;
}

#[gtk::template_callbacks]
impl SimpleWidget {
    #[template_callback]
    fn on_clicked(&self, _button: &gtk::Button) {
        println!("Clicked!");
    }
}
```

More details can be found in <https://gtk-rs.org/gtk4-rs/stable/latest/docs/gtk4_macros/derive.CompositeTemplate.html> and <https://gtk-rs.org/gtk4-rs/stable/latest/docs/gtk4_macros/attr.template_callbacks.html>.

### Book, Documentations, Examples

Great bindings by themselves sadly won't help newcomers trying to learn GTK for the first time, despite the increasing number of apps written using `gtk4-rs`.

For that reason, Julian Hofer has been writing a "GUI development with Rust and GTK 4" book that you can find at <https://gtk-rs.org/gtk4-rs/stable/latest/book/>.

On top of that, we spend a good amount of time ensuring the documentation we provide, which is based on the C library documentation, has valid intra-links, uses the images provided by GTK C documentation to represent the various widgets, and that most of the types and functions are properly documented.

The `gtk4-rs` repository also includes ~35 examples that you can find in <https://github.com/gtk-rs/gtk4-rs/tree/master/examples>. Finally there's a `GTK & Rust` application repository template that you can use to get started with your next project: <https://gitlab.gnome.org/World/Rust/gtk-rust-template>.

## Flatpak & Rust SDKs

Beyond the building blocks provided by the bindings, we have also worked on providing stable and nightly Rust SDKs that can be used to either distribute your application as a Flatpak or as a development environment. The stable SDK comes with [the Mold linker](https://github.com/rui314/mold) pre-installed as well, which is recommended for improving build times.

Flatpak can be used as a development environment with either [GNOME Builder](https://flathub.org/apps/details/org.gnome.Builder), VSCode with the [flatpak-vscode](https://marketplace.visualstudio.com/items?itemName=bilelmoussaoui.flatpak-vscode) extension, or [fenv](https://gitlab.gnome.org/ZanderBrown/fenv/), if you prefer the CLI for building/running your application.

- <https://github.com/flathub/org.freedesktop.Sdk.Extension.rust-stable>
- <https://github.com/flathub/org.freedesktop.Sdk.Extension.rust-nightly>

## Portals

Modern Linux applications should make use of the [portals](https://flatpak.github.io/xdg-desktop-portal/) to request runtime permissions to access resources, such as capturing the camera feed, starting a screencast session or picking a file. 

[ASHPD](https://crates.io/crates/ashpd) is currently the way to go for using portals from Rust as it provides a convenient and idomatic API on top of the DBus one.

Code example from `ashpd-0.4.0-alpha.1` for using the color picker in a desktop environment agnostic way:
```rust
use ashpd::desktop::screenshot::ColorResponse;

async fn run() -> ashpd::Result<()> {
    let color = ColorResponse::builder().build().await?;
    println!("({}, {}, {})", color.red(), color.green(), color.blue());
    Ok(())
}
```


## Keyring & oo7

Applications that need to store sensitive information, such as passwords, usually use the [Secret service](https://specifications.freedesktop.org/secret-service/latest/), a protocol supported by both `gnome-keyring` and `kwallet` nowadays. There were multiple attempts to provide a Rust wrapper for the DBus API but some common pitfalls were that they lacked async support, provided no integration with the secret portal, or they had no way to allow applications to migrate their secrets from the host keyring to the application sandboxed keyring.

Those were the primary reasons we started working on [oo7](https://crates.io/crates/oo7). It is still in alpha stage, but should cover most of the use cases already.

## GStreamer

Part of the experiments I did when porting [Authenticator](https://gitlab.gnome.org/World/Authenticator) to GTK 4 was figuring out how I can replicate the internal GStreamer sink included in GTK to convert a video frame into a `gdk::MemoryTexture` in order to render it in some widget for QR code scanning purposes.

Jordan Petridis took over my WIP work and turned it into a proper GStreamer plugin written in Rust, see <https://gitlab.freedesktop.org/gstreamer/gst-plugins-rs/-/tree/main/video/gtk4> for an example on how to use it in your application.

## Missing Integrations

### Better Gettext Support

Currently, [gettext](https://www.gnu.org/software/gettext/) doesn't support Rust officially, and most importantly, it doesn't like the `!` character, that is used by declarative macros in Rust, such as `println!` and `format!`, so we can't use string formatting for translatable texts. 

Kévin Commaille has submitted a [patch](https://savannah.gnu.org/bugs/?56774) for upstream gettext but sadly it hasn't been reviewed yet :( For now people are working around this by manually replacing variable names with <https://doc.rust-lang.org/std/primitive.str.html#method.replace>, which is not ideal, but it is what we have for now.

### Reduced Boilerplate in Subclassing Code

As mentioned above, subclassing code is still too verbose in some cases. Ideally, we would simplify most of it, since it is probably one of the most confusing things you have to deal with as a beginner to the gtk-rs ecosystem.

### Even Better Documentation

I personally think our documentation has gotten a lot better in the last couple of releases but there are always things to improve. Here is my wishlist of things that I hope to find the time to work on for the next release:

- Generate properties/signals documentation <https://github.com/gtk-rs/gir/issues/1076>
- Basic subclassing code documentation <https://github.com/gtk-rs/gir/issues/1319>
- Correct linking of external crates in case of manually implemented functions <https://github.com/gtk-rs/gir/issues/1197>
- Generate a UML graph for the object hierarchy <https://github.com/gtk-rs/gir/issues/1035>

Feel free to pick any of the above issues if you would like to help.

### Automatically-Generated Subclassing Traits

Presently, we have to manually write all the necessary traits needed for making it possible to subclass a type or implement an interface.

Sadly, we can't do much about it today as we would need new gobject-introspection annotations, see e.g. <https://gitlab.gnome.org/GNOME/gobject-introspection/-/issues/411>.

### Fix GNOME CI Template to Avoid Duplicated Builds

Most of the GNOME applications hosted on <https://gitlab.gnome.org> are using <https://gitlab.gnome.org/GNOME/citemplates/> as a CI template to provide a Flatpak job. The template is inefficient when building a Rust application as it removes the Flatpak repository between a regular build and a test build, which means rebuilding all the crates a second time, see <https://gitlab.gnome.org/GNOME/citemplates/-/issues/5>. `flatpak-builder` itself already provides an easy way to run the tests of a specific module, which is what `flatpak-github-actions` uses, but I am yet to find the time and apply the same thing to GNOME's CI template.

## Special Thanks

- Julian Hofer for the gtk4-rs book
- [Christopher Davis](https://blogs.gnome.org/christopherdavis/), Jason Francis, Paolo Borelli for their work on composite templates macros
- [Sophie Herold](https://blogs.gnome.org/sophieh/) for her awesome work implementing the portal backend of oo7
- [Zeeshan](http://zee-nix.blogspot.com/) for zbus/zvariant which unlocked plenty of use cases
- wayland-rs developers for making it possible to integrate Wayland clients with ASHPD
- Every other contributor to the gtk-rs ecosystem
- Ivan Molodetskikh, Sebastian Dröge and Christopher Davis for reviewing this post
