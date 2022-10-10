+++
title = "Store and display GeoJSON data using Flask, MongoDB & Leaflet"
date = 2019-06-28
draft = false

[taxonomies]
categories = ["Web", "Python"]
tags = ["Web", "Python"]

[extra]
lang = "en"
toc = true
math = false
mermaid = false
cc_license = true
+++

[Flask](http://flask.pocoo.org/) is a lightweight **Python** framework (that can somehow be compared to **Slim framework** for **PHP**). Additional functionalities can be added by installing Flask extensions. **GeoJSON** is a format that allows us to encode geolocation data as **JSON**. You can read more about the specifications [here](https://geojson.org/) and play with it a bit on this very well made website.

The usage of **MongoDB** is not arbitrary here, as it allows us to store geolocation data easily. You might need to install it on your system before following this article.

Let's set up a new virtual environment using **virtualenv**
```bash
virtualenv flask-mongodb
source ./flask-mongodb/bin/activate
```

We can now install the required packages

```bash
pip3 install flask
pip3 install pymongo
```

## Our first website using Flask

Building a plain simple website using Flask is pretty straight forward as we don't have to spend hours configuring stuff that we might never use.

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def main():
    return 'Hello world!'

app.run()
```

Let's run our **WSGI** application using python3 main.py and head to <https://127.0.0.1:5000/> to see our beautiful website.

Flask uses **Jinja2** as a templates engine, it allow us to render HTML templates. It uses the templates directory by default, so let's create that and add a simple HTML file.

```html
<!DOCTYPE html>
<head>
    <title>GeoJSON + Flask + MongoDB</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>
        Let's display some nice maps here!
    </h1>
</body>
</html>
```

We can use the render_template function to render an HTML file which will render (pretty obvious from the function name) and create a response from that HTML content.

```python
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def main():
    return render_template('main.html')

app.run()
```

## Pymongo, the MongoDB Python API

**Pymongo** is the Python implementation of the MongoDB API, that can allow us to communicate with mongodb using Python. The mongdb daemon must be running during that process. If it's your first time with your pymongo, have a look at the [official documentation](https://api.mongodb.com/python/current/tutorial.html).

Connecting to a MongoDB database is done by accessing the database name attribute from the client object.

```python
from pymongo import MongoClient

client = MongoClient()
db = client.geojson_flask
```
Let's add some geospatial data that we can display later.

```python
addresses = db.addresses_collection
addresses.insert_one({
    'type': 'Point',
    'coordinates': [41.39826, 17.13559]
})
```

GeoJSON supports multiple objects types like Point, LineString, Polygon... You can find the list of those and how to store them on a MongoDB collection [here](https://docs.mongodb.com/manual/reference/geojson/) or by reading the GeoJSON [specs](https://tools.ietf.org/html/rfc7946).

Now that we have some data stored on our collection, we need to provide a simple API to fetch that data so we can display it later on our HTML page, we will see the reason later. Our API endpoint should return a JSON object with all the points coordinates we have stored in our collection.

```python
from flask import jsonify
@app.route('/points', methods=['GET'])
def get_all_points():
    points = []
    for address in addresses.find({'type': 'Point'}):
        points.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": address['coordinates']
            }
        })
    return jsonify(points)
```

Flask provides a jsonify method which converts our dict object to a JSON object and adds the correct content-type header.

## Displaying the data with OpenStreetMap & Leaflet

In order to display our map, we will be using [Leaflet](https://leafletjs.com/), which is a JS library that allows us to interact with maps easily. We won't be using any JS build system here, if you are using VueJS in your project, you can use [Vue2Leaflet](https://korigan.github.io/Vue2Leaflet/#/)

Let's add the JS & CSS files to our HTML file
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"></script>
```

We can now create a new map using Leaflet and pass the center position and the zoom level.

```html
<div id="map" style="height: 80vh;"></div>

<script>
let map = L.map('map').setView([51.505, -0.09], 13)   
</script>
```

If you want to center the map on the user's current location, you can use this, which will ask the user to allow your website to access their current geolocation and update the center to that position.

```javascript
var map = L.map('map').setView([51.505, -0.09], 13)
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition((position) => {
		map.panTo(L.latLng(position.coords.latitude, position.coords.longitude))
	})
}
```

If we run the current code, nothing will be displayed on our map as we need to specify a tile provider first. We will be using Open Street Map

```javascript
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { attribution: 'OSM' }).addTo(map)
```

![Rendered maps using leaflet](/posts/4-display-geojson-data-using-flask-and-mongodb/Screenshot-from-2019-06-28-22-17-19.png)


Yay, our map is finally showing up! Let's fetch the data from that simple API endpoint we have made before and add those to our Leaflet map.

Let’s fetch the data from that simple API endpoint we have made before and add those to our Leaflet map. We can use a simple XMLHTTPRequest, but I prefer using axios, which is a simple HTTP client.

```html
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
```

We can fetch the data from our API endpoint using axios.get
```javascript
axios.get('http://127.0.0.1:5000/points')
    .then(response => {
        console.log(response.data)
    })
```

Leaflet supports creating a GeoJSON layer and display it on the map

```javascript
L.geoJSON(response.data, {}).addTo(map)
```

As you can see, the advantages of using Leaflet to display the data we have stored on our MongoDB pretty easy, as we won't need to change much in our code in the future if we want to display in kind of GeoJSON features.

## Conclusion

I wrote this article after doing some research on how to handle geospatial data and how can I display them pretty easily on a project I'm working on. You should by now have an idea of how to

- Get started with simple Flask web pages

- GeoJSON, what's and how to store the data in a proper database like MongoDB

- How to fetch and display the data using axios and Leaflet.

You can find the final code here with a few tweaks to allow showing whatever type of GeoJSON features.

```python
from flask import Flask, render_template, jsonify

app = Flask(__name__)
from pymongo import MongoClient

client = MongoClient()
db = client.geojson_flask
geodata_collection = db.geodata

@app.route('/geojson-features', methods=['GET'])
def get_all_points():
    features = []
    for geo_feature in geodata_collection.find({}):
        features.append({
            "type": "Feature",
            "geometry": {
                "type": geo_feature['geometry']['type'],
                "coordinates": geo_feature['geometry']['coordinates']
            }
        })
    return jsonify(features)

@app.route('/')
def main():
    return render_template('main.html')

app.run()
```

```html
<!DOCTYPE html>

<head>
    <title>GeoJSON + Flask + MongoDB</title>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
</head>

<body>
    <h1>
        Let's display some nice maps here!
    </h1>
    <div id="map" style="height: 80vh;"></div>

    <script>

        var map = L.map('map').setView([51.505, -0.09], 13)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                map.panTo(L.latLng(position.coords.latitude, position.coords.longitude))
            })
        }
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: 'Open street map'
        }).addTo(map)

        axios.get('http://127.0.0.1:5000/geojson-features')
            .then(response => {
                console.log(response.data)
                L.geoJSON(response.data, {}).addTo(map);

            })
    </script>

</body>
</html>
```