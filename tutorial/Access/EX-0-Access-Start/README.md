# Using the Tradovate API

## What's an API?
One of the most powerful features of modern applications is the ability to access
the building blocks of that application via its API. API stands for Application 
Programming Interface - literally an interface to build applications with. Developers 
often expose their API's functionality to the public, allowing people to use their 
application for personal or open-source projects. In web development, we typically
access APIs by making an HTTP request. If you don't know how to use the `fetch` function
to make HTTP requests, or if you're not familiar with `Promise`s and the async/await pattern, I'd suggest brushing 
up on those subjects before proceeding with this document. 

<!-- add more about the end goal of this application -->
## Accessing the Tradovate API
Today I'd like to discuss how to access and practically utilize the features of the Tradovate API. We will build a series of tiny applications using data retrieved in real time from from Tradovate. The first thing we'll need to do to access the API is get our hands on an API Key.

### Get Your API Key
[Please follow this guide to get an API Key.](https://community.tradovate.com/t/how-do-i-access-the-api/2380)

### Setup the Project
Now that we're signed up to use the API, we can attempt to get an auth token. Let's fire up a brand new project. You can clone [the entire tutorial](https://github.com/tradovate/example-api-js/) to easily follow along. Once you have the project cloned, open a terminal and navigate to the tutorial directory. Then navigate to one of the `/EX-n` directories of your choosing and run this command:

```
> yarn install
```

That will install the dependencies for the particular project you've opened. Once we're all done installing, let's look at what we have to start with. Our project structure looks something like this:

```
|-EX-0-Access-Start
|---src
|-----app.js
|-----connect.js
|-----services.js
|---babel.config.json
|---index.html
|---package.json
|---webpack.config.js
...
|-

```

Let's take a look at `connect.js`.

```js
import { URLs } from '../../../tutorialsURLs'

const { DEMO_URL } = URLs

export const connect = () => { /*...*/ }
```

This is essentially an empty template for us to fill in. But before we start writing code, let's look at a very important point regarding our static data. Look at the top line:
```js
import { URLs } from '../../../tutorialsURLs'
```

All our credentials and URLs will come from the same two files across each of these tutorials. We should look at those right now. Collapse the Access and WebSockets folders in the `tutorial` directory, and look at the two `.js` files there. We have `tutorialsCredentials.js` and `tutorialsURLs.js`. The most important one is `tutorialsCredentials`. If we open it up, we'll see this:

```js
export const credentials = {
    name:       "Your credentials here",
    password:   "Your credentials here",
    appId:      "Sample App",
    appVersion: "1.0",
    cid:        0,
    sec:        "Your API secret here"
}
```

All of the tutorials rely on this information to get an access token using your credentials, API cid and secret key. You will need to fill them out with your own data before you can proceed with the tutorial series, so be sure to do that now.

With that matter out of the way, let's proceed to writing our `connect` function.

## Playing Fetch
In order to call out to any API from a web browser, we must use the `fetch` function. `fetch` takes a URL and some optional configuration and returns a `Promise`. A `Promise` is a special data type that represents data you don't have yet. After constructing a promise, it will begin running its course, trying to retrieve data. There are two paths a Promise may take from this point - resolution or rejection. When a promise resolves, we get data back from a server or database somewhere. When a promise is rejected, we instead get an error message that (hopefully) tells us something about what went wrong. 

Let's try to write our first `fetch`. In the body of `connect`, add this code:

```javascript
const connect = () => {
    fetch(DEMO_URL + '/auth/accesstokenrequest')
}
```

What we're doing here is asking our browser to `fetch` a resource located at our base URL plus `/auth/accesstokenrequest`. The string we append to the end of our base URL is known as an *endpoint*. Typically an endpoint is associated with a function on the back end. So when we ask to retrieve the data located at our URL plus `/auth/accesstokenrequest`, we are actually asking the backend to call a function associated with that endpoint and *maybe* give us a response back. In our case, we are looking for a response containing an authorization token.

However, if we were to run that code, it would do nothing. That's because we've given it absolutely no instruction
for what to do with data if it retrieves anything. Let's rectify that, using the Promise's `.then` method.

```javascript
const connect = () => {
    fetch(DEMO_URL + '/auth/accesstokenrequest')
        .then(data => console.log(data))
}
```

Now we have something we can run. Open the file called `app.js` in `src` and uncomment `connect()`.

```javascript
import { connect } from './connect'

connect()
```

When we run that code, we'll get an error. We should see `GET 400`, an error that basically means we've not made our request correctly and the server couldn't give us anything back. This actually makes perfect sense, because each endpoint has unique expectations - none of which we've accounted for. Remember our `credentials` object? We will need to provide it in our request body to make this code work, which we will explore in the next section.

---

## API Endpoint Reference

This project communicates with the Tradovate REST API. The full trading endpoint specification is available in the [`trading`](./trading) file. Below is a concise reference organized by category.

### Authentication

All endpoints (except `/auth/accesstokenrequest`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain a token by POSTing your credentials to `/auth/accesstokenrequest`:

```js
// _usetoken must be false — no token exists yet
const response = await tvPost('/auth/accesstokenrequest', credentials, false)
const { accessToken, expirationTime } = response
```

Once obtained, the helpers `tvGet` and `tvPost` in `services.js` attach the token automatically.

---

### Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success — body contains the JSON payload |
| `400` | Bad request — missing or malformed parameters |
| `401` | Unauthorized — token is missing or has expired; re-authenticate |
| `404` | Entity not found |
| `429` | Too many requests — slow down and retry with back-off |

Error responses have the shape:

```json
{ "errorText": "human-readable error description" }
```

---

### Contract Library Endpoints

These endpoints provide read-only access to contracts, products, exchanges, and related reference data. All require authentication.

| Endpoint | Method | Description | Required param |
|----------|--------|-------------|----------------|
| `/contract/find` | GET | Find a contract by name | `name` (string) |
| `/contract/item` | GET | Get a single contract by id | `id` (integer) |
| `/contract/items` | GET | Get multiple contracts by ids | `ids` (comma-separated integers) |
| `/contract/ldeps` | GET | Get contracts for multiple maturities | `masterids` (comma-separated integers) |
| `/contract/suggest` | GET | Auto-complete contract name search | `t` (string), `l` (integer, max results) |
| `/contract/rollcontract` | POST | Roll a single contract | see `trading` spec |
| `/contract/rollcontracts` | POST | Roll multiple contracts | see `trading` spec |
| `/contract/getproductfeeparams` | POST | Query fee parameters for a product | see `trading` spec |
| `/contractGroup/list` | GET | List all contract groups | — |
| `/contractGroup/find` | GET | Find a contract group by name | `name` (string) |
| `/contractGroup/item` | GET | Get a contract group by id | `id` (integer) |
| `/contractMaturity/item` | GET | Get a contract maturity by id | `id` (integer) |
| `/contractMaturity/deps` | GET | Get maturities for a contract | `masterid` (integer) |
| `/currency/list` | GET | List all currencies | — |
| `/currency/item` | GET | Get a currency by id | `id` (integer) |
| `/exchange/list` | GET | List all exchanges | — |
| `/exchange/item` | GET | Get an exchange by id | `id` (integer) |
| `/product/list` | GET | List all products | — |
| `/product/item` | GET | Get a product by id | `id` (integer) |
| `/product/find` | GET | Find a product by name | `name` (string) |

```js
// Example: look up a contract by name
const contract = await tvGet('/contract/find', { name: 'MNQM3' })

// Example: get a product by id
const product = await tvGet('/product/item', { id: 42 })
```

---

### Order Endpoints

These endpoints expose order commands and command reports. All require authentication.

| Endpoint | Method | Description | Required param |
|----------|--------|-------------|----------------|
| `/command/list` | GET | List all commands | — |
| `/command/item` | GET | Get a single command by id | `id` (integer) |
| `/command/items` | GET | Get multiple commands by ids | `ids` (comma-separated integers) |
| `/command/deps` | GET | Get commands for an order | `masterid` (integer) |
| `/command/ldeps` | GET | Get commands for multiple orders | `masterids` (comma-separated integers) |
| `/commandReport/deps` | GET | Get reports for a command | `masterid` (integer) |
| `/order/placeOrder` | POST | Place a new order | see `trading` spec |

```js
// Example: place a market buy order
const order = await tvPost('/order/placeOrder', {
    accountSpec: myAcct.name,
    accountId:   myAcct.id,
    action:      'Buy',       // 'Buy' | 'Sell'
    symbol:      'MNQM3',
    orderQty:    1,
    orderType:   'Market',    // 'Market' | 'Limit' | 'Stop' | 'StopLimit' | ...
    isAutomated: false
})
```

---

### Pagination

List endpoints (e.g. `/contract/list`, `/product/list`) return all matching entities in a single array — there is no cursor-based pagination. Use `id`/`ids` or `masterid`/`masterids` parameters to narrow results and avoid fetching more data than necessary.

---

### Rate Limits

Avoid sending bursts of requests to the same endpoint. As a guideline, do not exceed one request per second per endpoint. If you receive a `429` response, wait and retry using exponential back-off:

```js
async function fetchWithRetry(endpoint, query, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        const result = await tvGet(endpoint, query)
        if (result && !result.errorText) return result
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)))
    }
}
```

---

### [Next Section >](http://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-1-Simple-Request)
