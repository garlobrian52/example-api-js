import { getAccessToken } from './storage'
import { URLs } from '../../../tutorialsURLs'

const { DEMO_URL, LIVE_URL } = URLs

/**
 * Make GET requests to the Tradovate REST API. The `query` object is serialized
 * into a URL query string (`?key=value&...`) and appended to `endpoint`.
 *
 * **Authentication** – Every request requires a valid Bearer token obtained via
 * `/auth/accesstokenrequest`. The token is read automatically from session
 * storage; call `connect()` before using this function.
 *
 * **Common endpoint categories** (see the `trading` spec for the full list):
 * - Contract Library: `/contract/item`, `/contract/find`, `/contract/suggest`,
 *   `/contractGroup/list`, `/exchange/list`, `/product/list`, `/currency/list`
 * - Orders: `/command/list`, `/command/item`, `/commandReport/deps`
 *
 * **Status codes**
 * - `200` – Success; body contains the requested JSON payload.
 * - `400` – Bad request (missing or invalid parameters).
 * - `401` – Unauthorized; token is missing or expired — re-authenticate.
 * - `404` – Entity not found.
 *
 * **Pagination** – List endpoints return arrays. Use the `masterid` (or `ids`)
 * parameter to filter results; there is no cursor-based pagination.
 *
 * ```js
 * // No query parameters
 * const accounts = await tvGet('/account/list')
 *
 * // With query parameters — URL becomes '/contract/item?id=2287764'
 * const contract = await tvGet('/contract/item', { id: 2287764 })
 *
 * // Target the live environment
 * const liveAccounts = await tvGet('/account/list', null, 'live')
 * ```
 *
 * You can also call this function from the browser developer console:
 * ```
 * > tradovate.get('/account/list')          //=> account data []
 * > tradovate.get('/contract/item', {id: 12345}) //=> Contract | undefined
 * ```
 *
 * @param {string} endpoint - API path, e.g. `'/contract/item'`
 * @param {{[k:string]: any} | null} query - Key-value pairs serialized as query string; pass `null` for none
 * @param {'demo' | 'live'} env - Target environment (default: `'demo'`)
 * @returns {Promise<any>} Parsed JSON response body
 */
export const tvGet = async (endpoint, query = null, env = 'demo') => {
    const { token } = getAccessToken()
    try {
        let q = ''
        if(query) {
            q = Object.keys(query).reduce((acc, next, i, arr) => {
                acc += next + '=' + query[next]
                if(i !== arr.length - 1) acc += '&'
                return acc
            }, '?')
        }

        console.log('With query:', q.toString() || '<no query>')

        let baseURL = env === 'demo' ? DEMO_URL : env === 'live' ? LIVE_URL : ''        
        if(!baseURL) throw new Error(`[Services:tvGet] => 'env' variable should be either 'live' or 'demo'.`)

        let url = query !== null
            ? baseURL + endpoint + q
            : baseURL + endpoint

        console.log(url)

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const js = await res.json()

        return js

    } catch(err) {
        console.error(err)
    }
}

/**
 * Make POST requests to the Tradovate REST API. `data` is sent as a JSON body.
 *
 * **Authentication** – Pass `_usetoken = true` (default) to include the Bearer
 * token automatically. Set it to `false` only for unauthenticated endpoints
 * such as `/auth/accesstokenrequest`.
 *
 * **Common POST endpoints**:
 * - `/auth/accesstokenrequest` – Obtain an access token (`_usetoken = false`)
 * - `/order/placeOrder` – Place a new order
 * - `/contract/getproductfeeparams` – Query product fee parameters
 * - `/contract/rollcontract` / `/contract/rollcontracts` – Roll a contract
 *
 * **Request body shape** varies by endpoint; refer to the `trading` spec for
 * the required and optional fields for each operation.
 *
 * **Error payload** – On failure the API returns:
 * ```json
 * { "errorText": "human-readable message" }
 * ```
 *
 * **Rate limits** – Avoid sending more than one request per second on the same
 * endpoint to prevent `429 Too Many Requests` responses. Implement exponential
 * back-off on retries.
 *
 * ```js
 * // Place a market buy order
 * const order = await tvPost('/order/placeOrder', {
 *   accountSpec: myAcct.name,
 *   accountId:   myAcct.id,
 *   action:      'Buy',
 *   symbol:      'MNQM1',
 *   orderQty:    2,
 *   orderType:   'Market',
 *   isAutomated: true
 * })
 *
 * // Authenticate (no token required)
 * const token = await tvPost('/auth/accesstokenrequest', credentials, false)
 * ```
 *
 * @param {string} endpoint - API path, e.g. `'/order/placeOrder'`
 * @param {{[k:string]: any}} data - Request body; serialized to JSON
 * @param {boolean} _usetoken - Include Bearer token header (default: `true`)
 * @param {'live' | 'demo'} env - Target environment (default: `'demo'`)
 * @returns {Promise<any>} Parsed JSON response body
 */
export const tvPost = async (endpoint, data, _usetoken = true, env = 'demo') => {
    const { token } = getAccessToken()
    const bearer = _usetoken ? { Authorization: `Bearer ${token}` } : {} 

    let baseURL = env === 'demo' ? DEMO_URL : env === 'live' ? LIVE_URL : ''
    if(!baseURL) throw new Error(`[Services:tvPost] => 'env' variable should be either 'live' or 'demo'.`)

    try {
        const res = await fetch(baseURL + endpoint, {
            method: 'POST',
            headers: {
                ...bearer,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        const js = await res.json()

        return js

    } catch(err) {
        console.error(err)
    }
}

//New! Interact with the API via browser console.
window.tradovate = {
    get: tvGet,
    post: tvPost
}