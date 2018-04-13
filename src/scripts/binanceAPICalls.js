const axios = require('axios')
const crypto = require('crypto')

const api_endpoint = "https://api.binance.com"

export class binanceAPI{
    constructor(key, secret){
        this.api_key = key
        this.api_secret = secret

        this.axInstance = axios.create({
            baseURL: api_endpoint,
            headers: {
                common : {
                    "X-MBX-APIKEY" : this.api_key
                }
            }
        })

        this.getOpenOrders = this.getOpenOrders.bind(this)
        this.getAssets = this.getAssets.bind(this)
        this.getSymbols = this.getSymbols.bind(this)
    }

    /**
     * Makes an API call to get open orders. 
     * 
     * @param {function} callback - the callback function that will be called when response is received.
     */
    getOpenOrders(callback, errorHandler){
        let query = 'timestamp=' + Date.now()
    
        this.axInstance.get('/api/v3/openOrders?' + query + '&signature=' + genSignature(query, this.api_secret)).then(res => {
            let openOrders = null
    
            try {
                openOrders = res.data.map(order => ({
                    symbol: order.symbol,
                    price: Number(order.price),
                    quantity: Number(order.origQty),
                    type: order.type + ' ' + order.side,
                    time: new Date(order.time),
                    id: order.orderId
                }))
            }
            catch(e){
                console.log('Failed to parse open orders response from Binance: ' + e)
            }
            callback(openOrders)
        }).catch(e => errorHandler(e))
    }


    /**
     * Makes an API call to get account balances. 
     * 
     * @param {function} callback - the callback function that will be called when response is received.
     */
    getAssets(callback, errorHandler){    
        let query = 'timestamp=' + Date.now()

        this.axInstance.get('/api/v3/account?' + query + '&signature=' + genSignature(query, this.api_secret)).then(res => {
            
            let balances = null

            try{   
                balances = res.data.balances.map(asset => ({
                    symbol : asset.asset,
                    freeBalance : Number(asset.free),
                    lockedBalance : Number(asset.locked),
                    totalBalance : Number(asset.free) + Number(asset.locked)
                }))
            }
            catch(e){
                console.log("Failed parsing received Binance balances: " + e)
            }

            callback(balances)
        }).catch(e => errorHandler(e))
    }

    /**
     * Makes an API call to get all the symbols that are trading on Binance exchange. 
     * 
     * @param {function} callback - the callback function that will be called when response is received.
     */
    getSymbols(callback, errorHandler){
        
        // Retrieves all the symbols from the response and sends it as parameter to the callback function
        this.axInstance.get('/api/v1/exchangeInfo').then(res => {

            try{
                
                const symbols = res.data.symbols.map(obj => obj.symbol)

                callback(symbols)

            }
            catch(e){

                console.log("Failed to parse symbols: " + e)
            }}).catch(e => errorHandler(e))
        }      

}

/**
 * Generates a signature for API call request. 
 * 
 * @param {String} query - parameters to sign. Ex: symbol=ETHBTC&timestamp=123
 * @return {String} signature
 */
function genSignature(query, api_secret){
    var hmac = crypto.createHmac('sha256', api_secret)
    hmac.update(query)
    return hmac.digest('hex')
}