+++
title = "Testing a Rust library - Code Coverage"
date = 2025-10-13
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
It has been a couple of years since I started working on a Rust library called [oo7](https://lib.rs/crates/oo7) as a Secret Service client implementation.
The library ended up also having support for per-sandboxed app keyring using the Secret portal with a seamless API for end-users that makes usage from the application side straightforward.

The project, with time, grew support for various components:
- [oo7-cli](https://github.com/bilelmoussaoui/oo7/tree/main/cli): A secret-tool replacement but much better, as it allows not only interacting with the Secret service on the DBus session bus but also with any keyring.
  `oo7-cli --app-id com.belmoussaoui.Authenticator list`, for example, allows you to read the sandboxed app with app-id `com.belmoussaoui.Authenticator`'s keyring and list its contents, something that is not possible with secret-tool.
- [oo7-portal](https://github.com/bilelmoussaoui/oo7/tree/main/portal): A server-side implementation of the Secret portal mentioned above. Straightforward, thanks to my other library ASHPD.
- [cargo-credential-oo7](https://github.com/bilelmoussaoui/oo7/tree/main/cargo-credential): A [cargo credential provider](https://doc.rust-lang.org/stable/cargo/reference/registry-authentication.html#registry-authentication) built using oo7 instead of [libsecret](https://github.com/rust-lang/cargo/tree/master/credential/cargo-credential-libsecret).
- [oo7-daemon](https://github.com/bilelmoussaoui/oo7/tree/main/server): A server-side implementation of the Secret service.

The last component was kickstarted by [Dhanuka Warusadura](https://github.com/warusadura), as we already had the foundation for that in the client library, especially the file backend reimplementation of gnome-keyring. The project is slowly progressing, but it is almost there!

The problem with replacing such a very sensitive component like gnome-keyring-daemon is that you have to make sure the very sensitive user data is not corrupted, lost, or inaccessible. For that, we need to ensure that both the file backend implementation in the `oo7` library and the daemon implementation itself are well tested.

That is why I spent my weekend, as well as a whole day off, working on improving the test suite of the wannabe core component of the Linux desktop.

## Coverage Report

One metric that can give the developer some insight into which lines of code or functions of the codebase are executed when running the test suite is code coverage.

In order to get the coverage of a Rust project, you can use a project like [Tarpaulin](https://github.com/xd009642/tarpaulin/), which integrates with the Cargo build system.
For a simple project, a command like this, after installing Tarpaulin, can give you an HTML report:

```bash
cargo tarpaulin \
  --package oo7 \
  --lib \
  --no-default-features \
  --features "tracing,tokio,native_crypto" \
  --ignore-panics \
  --out Html \
  --output-dir coverage
```

Except in our use case, it is slightly more complicated. The client library supports switching between Rust native cryptographic primitives crates or using OpenSSL. We must ensure that both are tested.

For that, we can export our report in LCOV for native crypto and do the same for OpenSSL, then combine the results using a tool like [grcov](https://crates.io/crates/grcov).

```bash
mkdir -p coverage-raw
cargo tarpaulin \
  --package oo7 \
  --lib \
  --no-default-features \
  --features "tracing,tokio,native_crypto" \
  --ignore-panics \
  --out Lcov \
  --output-dir coverage-raw
mv coverage-raw/lcov.info coverage-raw/native-tokio.info

cargo tarpaulin \
  --package oo7 \
  --lib \
  --no-default-features \
  --features "tracing,tokio,openssl_crypto" \
  --ignore-panics \
  --out Lcov \
  --output-dir coverage-raw
mv coverage-raw/lcov.info coverage-raw/openssl-tokio.info
```
and then combine the results with
```bash
cat coverage-raw/*.info > coverage-raw/combined.info

grcov coverage-raw/combined.info \
  --binary-path target/debug/ \
  --source-dir . \
  --output-type html \
  --output-path coverage \
  --branch \
  --ignore-not-existing \
  --ignore "**/portal/*" \
  --ignore "**/cli/*" \
  --ignore "**/tests/*" \
  --ignore "**/examples/*" \
  --ignore "**/target/*"
```

To make things easier, I added a bash script to the project repository that generates coverage for both the client library and the server implementation, as both are very sensitive and require intensive testing.

With that script in place, I also used it on CI to generate and upload the coverage reports at <https://bilelmoussaoui.github.io/oo7/coverage/>. The results were pretty bad when I started.


## Testing

For the client side, most of the tests are straightforward to write; you just need to have a secret service implementation running on the DBus session bus. Things get quite complicated when the methods you have to test require a Prompt, a mechanism used in the spec to define a way for the user to be prompted for a password to unlock the keyring, create a new collection, and so on. The prompter is usually provided by a system component. For now, we just skipped those tests.

For the server side, it was mostly about setting up a peer-to-peer connection between the server and the client:
```rust
let guid = zbus::Guid::generate();
let (p0, p1) = tokio::net::UnixStream::pair().unwrap();

let (client_conn, server_conn) = tokio::try_join!(
    // Client
    zbus::connection::Builder::unix_stream(p0).p2p().build(),
    // Server
    zbus::connection::Builder::unix_stream(p1)
        .server(guid)
        .unwrap()
        .p2p()
        .build(),
)
.unwrap();
```

Thanks to the design of the client library, we keep the low-level APIs under `oo7::dbus::api`, which allowed me to straightforwardly write a bunch of server-side tests already.

There are still a lot of tests that need to be written and a few missing bits to ensure oo7-daemon is in an acceptable shape to be proposed as an alternative to gnome-keyring.

## Don't overdo it

The coverage report is not meant to be targeted at 100%. It’s not a video game. You should focus only on the critical parts of your code that must be tested. Testing a `Debug` impl or a `From` trait (if it is straightforward) is not really useful, other than giving you a small dose of dopamine from "achieving" something.

Till then, may your coverage never reach 100%.
