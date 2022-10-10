+++
title = "Oxidizing portals with zbus"
date = 2020-09-13
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


One major pain points of writing a desktop application that interacts with the user's desktop is that a "simple" task can easily become complex.  If you want to write a colour palette generator and you wanted to pick a colour, how would you do that? 

GNOME Shell for example provides a DBus interface `org.gnome.Shell.Screenshot` that you can communicate with by calling the `PickColor` method. The method returns a HashMap containing a single key `{"color" : [f64;3] }`. Thankfully with zbus calling a DBus method is pretty straightforward. 

```rust
use zbus::dbus_proxy;
use zvariant::OwnedValue;

#[dbus_proxy(interface = "org.gnome.Shell.Screenshot", default_path = "/org/gnome/Shell/Screenshot")]
trait Screenshot {
    // zbus converts the method names from PascalCase to snake_case.
    fn pick_color(&self) -> zbus::Result<HashMap<String, OwnedValue>>;
}
```

By using the [dbus_proxy](https://docs.rs/zbus/1.1.1/zbus/attr.dbus_proxy.html) macro, we can generate a [Proxy](https://docs.rs/zbus/1.1.1/zbus/struct.Proxy.html) containing the only method we care about. We can then use our auto generated `ScreenshotProxy` to call the pick colour method 

```rust
fn main() -> zbus::fdo::Result<()> {
    let connection = zbus::Connection::new_session()?;
    let proxy = ScreenshotProxy::new(&connection)?;
    
    let reply = proxy.pick_color()?;
    println!("{:#?}", reply); 
    // You can grab the color as Vec<f64> using
    let color = reply
            .get("color")
            .unwrap()
            .downcast_ref::<zvariant::Structure>()
            .unwrap()
            .fields()
            .iter()
            .map(|c| *c.downcast_ref::<f64>().unwrap())
            .collect::<Vec<f64>>();
    Ok(())
}
```

That looks simple if you were targeting GNOME Shell as the only desktop environment.  Supporting other desktop environments like KDE or any X11 based one for example would require more code from the application developer side.

# Introducing portals

Portals as in XDG portals, are a bunch of DBus interfaces as a specification that a desktop environment can implement. An application developer can then communicate with the XDG portal DBus interface instead of the desktop environment specific one. The portal implementation will take care of calling the available backend.  By their nature, the portals can't be tied to Flatpak except the few portals that were made especially for Flatpak'ed applications like the update monitor one.

You can find the list of the available portals by looking at the [specifications](https://flatpak.github.io/xdg-desktop-portal/index.html#idm28). Let's try to reimplement the same thing using the [XDG portal](https://flatpak.github.io/xdg-desktop-portal/index.html#gdbus-method-org-freedesktop-portal-Screenshot.PickColor) instead of the GNOME Shell one. As portals requires a user interaction, most of the method calls in the various portals returns an [ObjectPath](https://docs.rs/zvariant/2.1.0/zvariant/struct.ObjectPath.html) like this one `/org/freedesktop/portal/desktop/request/SENDER/TOKEN` that represents a [Request](https://flatpak.github.io/xdg-desktop-portal/index.html#gdbus-org.freedesktop.portal.Request). We should then listen to a [Response](https://flatpak.github.io/xdg-desktop-portal/index.html#gdbus-signal-org-freedesktop-portal-Request.Response) signal to get the result.

```rust
use zvariant::{OwnedObjectPath, OwnedValue};
use zbus::{dbus_proxy, fdo::Result};
use std::collections::HashMap;

#[dbus_proxy(
    interface = "org.freedesktop.portal.Screenshot",
    default_service = "org.freedesktop.portal.Desktop",
    default_path = "/org/freedesktop/portal/desktop"
)]
/// The interface lets sandboxed applications request a screenshot.
trait Screenshot {
    fn pick_color(
        &self,
        parent_window: &str,
        options: HashMap<String, OwnedValue>,
    ) -> Result<OwnedObjectPath>;
}
```

Calling the pick colour method will now gives as an Object Path instead of the result that would normally contain the colour.

```rust
let connection = zbus::Connection::new_session()?;
let proxy = ScreenshotProxy::new(&connection)?;
// We don't have a window identifier, see https://flatpak.github.io/xdg-desktop-portal/index.html#parent_window
let request_handle = proxy.pick_color("", HashMap::new())?;
println!("{:#?}", request_handle.as_str());
```

Now that we have the necessary object path we can listen to a response signal.  As of today, zbus doesn't provide a higher level API to await for a response signal. We will do with a simple loop as we can break out of it once we have received a Response signal.

```rust
loop {
	let msg = connection.receive_message()?;
	let msg_header = msg.header()?;
	if msg_header.message_type()? == zbus::MessageType::Signal
		& msg_header.member()? == Some("Response")
	{
	  // We can retrieve the body here, but we need to de-serialize it.
	  let response = msg.body::<T>()?;
	}
}
```

The type T here should implement `zvariant::Type` & `serde::de::DeserializeOwned`. From the [signal documentation](https://flatpak.github.io/xdg-desktop-portal/index.html#gdbus-signal-org-freedesktop-portal-Request.Response) we can figure out the struct we would need to de-serialize a typical response 

```rust
use serde_repr::{Deserialize_repr, Serialize_repr};
use serde::{Serialize, Deserialize};
use zvariant_derive::Type;

#[derive(Serialize_repr, Deserialize_repr, PartialEq, Debug, Type)]
#[repr(u32)]
enum ResponseType {
    /// Success, the request is carried out
    Success = 0,
    /// The user cancelled the interaction
    Cancelled = 1,
    /// The user interaction was ended in some other way
    Other = 2,
}

#[derive(Serialize, Deserialize, Debug, Type)]
pub struct Response(ResponseType, HashMap<String, OwnedValue>);
```

We can now de-serialize the body into a Response and call a `FnOnce` on it.  The HashMap in the case of a pick colour call will contain a single key `color` with a `[f64;3]` value. [zvariant_derive](https://docs.rs/zvariant_derive/2.1.0/zvariant_derive/) has a neat macro that allow us to de-serialize a `a{sv}` into a struct.

```rust
use zvariant_derive::{SerializeDict, DeserializeDict, TypeDict};

#[derive(SerializeDict, DeserializeDict, Debug, TypeDict)]
struct ColorResponse {
	pub color: [f64; 3],
}

#[derive(Serialize, Deserialize, Debug, Type)]
pub struct Response(pub ResponseType, pub ColorResponse);

fn main() -> zbus::fdo::Result<()> {
	let connection = zbus::Connection::new_session()?;
	let proxy = ScreenshotProxy::new(&connection)?;

	proxy.pick_color("", HashMap::new())?;

	let callback = |r: Response| {
		if r.0 == ResponseType::Success {
			println!("{:#?}", r.1.color);
		}
	};
	loop {
		let msg = connection.receive_message()?;
		let msg_header = msg.header()?;
		if msg_header.message_type()? == zbus::MessageType::Signal
			& msg_header.member()? == Some("Response")
		{
	  		let response = msg.body::<Response>()?;
	  		callback(response);
	  		break;
		}
	}
	Ok(())
}
```

Despite zbus being pretty straightforward to use, using portals requires the developer to look at the specifications and figure out which options a portal request can take or the possible responses that you might receive.  Those were the primary reasons I wrote ASHPD.

# The ASHPD crate

an acronym of Aperture Science Handheld Portal Device, which is the name of the portal gun in the Portal game, is a crate that aims to provide a simple API around the portals to consume from Rust. 

Let's see how can we pick the colour now using ashpd

```rust
use ashpd::desktop::screenshot::{Color, PickColorOptions, ScreenshotProxy};
use ashpd::{RequestProxy, Response, WindowIdentifier};
use zbus::{self, fdo::Result};

fn main() -> Result<()> {
    let connection = zbus::Connection::new_session()?;
    let proxy = ScreenshotProxy::new(&connection)?;
    
    let request_handle = proxy.pick_color(
            WindowIdentifier::default(),
            PickColorOptions::default()
    )?;

    let request = RequestProxy::new(&connection, &request_handle)?;
    request.on_response(|response: Response<Color>| {
        if let Ok(color) = response {
            println!("({}, {}, {})", color.red(), color.green(), color.blue());
        }
   })?;

   Ok(())
}
```

The crate proves it's usefulness for more complex portals like the [file chooser](https://flatpak.github.io/xdg-desktop-portal/index.html#gdbus-org.freedesktop.portal.FileChooser), here's an example from the docs on how easy it's to ask the user to select a file using the native file chooser without linking against GTK or Qt.

```rust
use ashpd::desktop::file_chooser::{
    Choice, FileChooserProxy, FileFilter, SelectedFiles, OpenFileOptions,
};
use ashpd::{RequestProxy, Response, WindowIdentifier};
use zbus::{fdo::Result, Connection};

fn main() -> Result<()> {
    let connection = Connection::new_session()?;

    let proxy = FileChooserProxy::new(&connection)?;
    let request_handle = proxy.open_file(
        WindowIdentifier::default(),
        "Select an SVG image to minify it",
        OpenFileOptions::default()
            .accept_label("_Open File")
            .modal(true)
            .multiple(true)
            .filter(FileFilter::new("SVG Image").mimetype("image/svg+xml")),
    )?;

    let request = RequestProxy::new(&connection, &request_handle)?;
    request.on_response(|r: Response<SelectedFiles>| {
        println!("{:#?}", r.unwrap());
    })?;

    Ok(())
}
```

Currently the crate supports all the available portals, though some signals might be missing till a proper signal support lands in upstream zbus. I'm very thankful for the help/support I've got from Zeeshan & Marc-André Lureau, my work wouldn't have been possible without zbus & zvariant.

If you would like to contribute, read a bit how some of the portals work or just have a more complex DBus API wrapper to learn how to use zbus

- Source code: <https://github.com/bilelmoussaoui/ashpd>
- Crates.io: <https://crates.io/crates/ashpd>
- Documentation : <https://docs.rs/ashpd/>

Until then, happy hacking!