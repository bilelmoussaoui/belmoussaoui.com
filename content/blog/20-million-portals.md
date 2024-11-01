+++
title = "A million portals"
date = 2024-11-01
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
outdate_warn = true
+++

Approximately four years ago, I published the first release of [ASHPD](https://crates.io/crates/ashpd), one of my first Rust libraries, with the simple goal of making it easy to use [XDG portals](https://flatpak.github.io/xdg-desktop-portal/docs/) from Rust.

Since then, the library has grown to support all available portals and even includes a [demo application](https://flathub.org/apps/com.belmoussaoui.ashpd.demo) showcasing some of these features.

Let's look at an example: the [`org.freedesktop.portal.Account`](https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.Account.html) portal. From the client side, an API end-user can request user information with the following code:

```rust
use ashpd::desktop::account::UserInformation;

async fn run() -> ashpd::Result<()> {
    let response = UserInformation::request()
        .reason("App would like to access user information")
        .send()
        .await?
        .response()?;

    println!("Name: {}", response.name());
    println!("ID: {}", response.id());

    Ok(())
}
```

This code calls the `org.freedesktop.portal.Account.GetUserInformation` D-Bus method, which `xdg-desktop-portal` will "redirect" to any portal frontend implementing the `org.freedesktop.impl.portal.Account` D-Bus interface.

So, how can you provide an implementation of `org.freedesktop.impl.portal.Account` in Rust? That's exactly what Maximiliano and I have been working on, building on the solid foundations we established earlier. I’m thrilled to announce that we finally shipped this functionality in the 0.10 release!

The first step is to implement the D-Bus interface, which we hide from the API’s end-user using traits.

```rust
use ashpd::{
    async_trait,
    backend::{
        account::{AccountImpl, UserInformationOptions},
        request::RequestImpl,
        Result,
    },
    desktop::account::UserInformation,
    AppID, WindowIdentifierType,
};

pub struct Account;

#[async_trait]
impl RequestImpl for Account {
    async fn close(&self) {
        // Close the dialog
    }
}

#[async_trait]
impl AccountImpl for Account {
    async fn get_user_information(
        &self,
        _app_id: Option<AppID>,
        _window_identifier: Option<WindowIdentifierType>,
        _options: UserInformationOptions,
    ) -> Result<UserInformation> {
        Ok(UserInformation::new(
            "user",
            "User",
            url::Url::parse("file://user/icon").unwrap(),
        ))
    }
}
```

Pretty straightforward! With the D-Bus interface implemented using ASHPD wrapper types, the next step is to export it on the bus.

```rust
use futures_util::future::pending;

async fn main() -> ashpd::Result<()> {
    ashpd::backend::Builder::new("org.freedesktop.impl.portal.desktop.mycustomportal")?
        .account(Account)
        .build()
        .await?;

    loop {
        pending::<()>().await;
    }
}
```

And that’s it—you’ve implemented your first portal frontend!

Currently, the backend feature doesn't yet support  [session-based portals](https://flatpak.github.io/xdg-desktop-portal/docs/sessions.html), but we hope to add that functionality in the near future.

With over 1 million downloads, ASHPD has come a long way, and it wouldn’t have been possible without the support and contributions from the community. A huge thank you to everyone who has helped make this library what it is today.
