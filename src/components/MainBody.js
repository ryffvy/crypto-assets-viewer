import React, { Component } from 'react';
import {SummaryView} from './SummaryView.js'
import {DetailsView} from './DetailsView.js'
import {ContentView} from './ContentView.js'
import {Grid, Row, Col} from 'react-bootstrap'
import PriorityQueue from 'js-priority-queue'
import {binanceAPI} from '../scripts/binanceAPICalls.js'

const callLimit = 5
const callWeights = {
    assets: 5,
    symbols: 1,
    openTrades: callLimit
} 
const callPriorities = {
    assets: 0,
    symbols: 0,
    openTrades: 2
}

/**
 * Compares priority of 2 API calls.
 * 
 * @param {Object} a - API call object
 * @param {Object} b - API call object
 */
var callsComparator = function(a, b){

    if (a.priority < b.priority) return -1
    
    if (a.priority > b.priority) return 1

    if (a.time > b.time) return 1

    if (a.time < b.time) return -1

    return 0
}

export class MainBody extends Component{

    constructor(props){

        super(props)

        this.state = {
            numberSymbols: 0,
            assets : [],
            totalValueBTC: null,
            openOrders : []
        }

        this.assetsValues = new Object()

        this.binance = new binanceAPI(props.api_key, props.api_secret)

        try{
            this.binance = new binanceAPI(props.api_key, props.api_secret)
        }
        catch(e){
            console.log("Failed to parse keys file. Please check your JSON file. " + e)
        }

        this.callsQueue = new PriorityQueue({comparator : callsComparator})
        this.timers = {}

        this.processSymbols = this.processSymbols.bind(this)
        this.processAssets = this.processAssets.bind(this)
        this.processOpenOrders = this.processOpenOrders.bind(this)
        this.apiErrorHandler = this.apiErrorHandler.bind(this)
        this.processAssetsValues = this.processAssetsValues.bind(this)
        this.updateTotalValue = this.updateTotalValue.bind(this)
    }

    componentDidMount(){
        
        this.scheduleAssetsCall()
        this.scheduleSymbolsCall()
        this.scheduleOpenOrdersCall()
        this.makeCalls()        

        this.timers.makeCalls = setInterval(this.makeCalls, 1100)
        
        this.timers.scheduleAssets = setInterval(this.scheduleAssetsCall, 60000)

        this.timers.scheduleSymbols = setInterval(this.scheduleSymbolsCall, 20000)

        this.timers.scheduleOpenOrders = setInterval(this.scheduleOpenOrdersCall, 20000)

        this.timers.updateTotalValue = setInterval(this.updateTotalValue, 1000)
    }

    componentWillUnmount(){
        this.stopCalls()
    }

    /* Scheduler Code */

    /**
     * Executes calls from the calls queue.
     */
    makeCalls = () => {

        if (this.callsQueue  && this.callsQueue.length !== 0){

            console.log("Calls in queue: " + this.callsQueue.peek().weight)
            for(let i = 0; this.callsQueue.length > 0 && (i + this.callsQueue.peek().weight) <= callLimit;){

                console.log("Making a call.")
                try {    

                    let call = this.callsQueue.dequeue()
                    call.function(call.callback, this.apiErrorHandler)
                    i += call.weight
                    //console.log("Dequeued. Calls in queue: " + this.callsQueue.length)
                }
                catch(e){

                    console.log("Failed to make a call." + e)
                }
            }
            
        }
        else{
            console.log("Calls queue is empty.")
        }
    }

    /**
     * Places a call for retrieval of assets from Binance into the calls queue.
     */
    scheduleAssetsCall = () => {
        if (this.callsQueue){
            this.callsQueue.queue({
                function: this.binance.getAssets, 
                callback : this.processAssets, 
                time: Date.now(), 
                priority: callPriorities.assets,
                weight: callWeights.assets
            })
            console.log("Scheduled Assets Rertieval")
        }
    }  
    
    /**
     * Places a call for retrieval of symbols from Binance into the calls queue.
     */
    scheduleSymbolsCall = () => {
        if (this.callsQueue){
            this.callsQueue.queue({
                function: this.binance.getSymbols,
                callback: this.processSymbols,
                time: Date.now(),
                priority: callPriorities.symbols,
                weight: callWeights.symbols
            })
            console.log("Scheduled Symbols Rertieval")
        }
    }

    /**
     * Places a call for retrieval of open orders into the calls queue.
     */
    scheduleOpenOrdersCall = () => {
        if(this.callsQueue){
            this.callsQueue.queue({
                function: this.binance.getOpenOrders,
                callback: this.processOpenOrders,
                time: Date.now(),
                priority: callPriorities.openTrades,
                weight: callWeights.openTrades
            })
        }
    }

    /**
     * Handles received response after making API call to Binance to get all symbols from exchange.
     * 
     * @param {Object} symbols - response from Binance.
     */
    processSymbols(symbols){

        console.log('Received Symbols')

        try{
            this.setState({
                numberSymbols : symbols.length
            })
            
        }catch(e){
            console.log(e)
        }

    }

    /**
     * Handles received response after making API call to Binance to get account's balances.
     * 
     * @param {Object} res - response from Binance.
     */
    processAssets(res){
        console.log('Received Assets')

        this.requestAssetsValues(res.filter((asset) => asset.totalBalance > 0))

        try{
            this.setState({
                assets : res.filter((asset) => asset.totalBalance > 0)
            })
        }catch(e){
            console.log('Failed processing assets: ' + e)
        }
    }

    /**
     * Handles received response after making API call to Binance to get open orders.
     * 
     * @param {Object} res - response from Binance.
     */
    processOpenOrders(res){
        console.log('Received Open Orders')

        try{
            this.setState({
                openOrders : res
            })
        }catch(e){
            console.log('Failed processing open orders: ' + e)
        }
    }

    /**
     * Handles error recieved while making API calls.
     * 
     * @param {String} error - error message.
     */
    apiErrorHandler(error){
        this.stopCalls()
    }

    /**
     * Stops scheduling and perfomring API calls.
     */
    stopCalls(){
        try{
            clearInterval(this.timers.scheduleAssets)
            clearInterval(this.timers.scheduleSymbols)
            clearInterval(this.timers.scheduleOpenOrders)
            clearInterval(this.timers.makeCalls)
            console.log("Stopped making calls.")
        }
        catch(e){
            console.log("Failed stop making calls: " + e)
        }
    }

    /**
     * Requests values of assets from Binance
     * 
     * @param {[Object]} assets - array of assets  
     */
    requestAssetsValues(assets){
        if (assets && this.binance){

            try{
                let symb = ""
                let stream = ""
    
                assets.forEach(element => {
                    symb = element.symbol.toLowerCase()
                    if (this.assetsValues[symb])
                        this.assetsValues[symb].quantity = Number(element.totalBalance) 
                    else 
                        this.assetsValues[symb] = {quantity: Number(element.totalBalance), valueBTC: 0}
    
                    if (symb == 'btc'){
                        this.assetsValues[symb].valueBTC = Number(element.totalBalance)
                    }
                    else {
                        if (symb == 'usdt') stream += 'btc' + symb + '@kline_1m/'
                        else stream += symb + 'btc@kline_1m/'
                    }
                })

            
                // trim last / from the stream
                stream = stream.substring(0, stream.length-1)
                console.log(stream)
                this.binance.createWebSocket(stream, this.processAssetsValues)
            }
            catch(e){
                console.log("Failed to create request for asset values: " + e)
            }
        }
        else {
            console.log("Failed to request values of assets.")
        }

    }

    /**
     * Saves received value of asset in BTC.
     * 
     * @param {String} res - response message from Binance 
     */
    processAssetsValues(res){
        try{
            let data = JSON.parse(res.data).data
            let symb = (data.s == 'BTCUSDT')?'usdt':data.s.substring(0, data.s.length - 3).toLowerCase()
            this.assetsValues[symb].valueBTC = (symb === 'usdt')?1/(Number(data.k.c)):Number(data.k.c)
        }
        catch(e){
            console.log("Failed parsing received asset value: " + e)
        }
    }

    /**
     * Updates the state with new total assets value
     * 
     */
    updateTotalValue(){
        let valueBTC = 0
        let count = 0
        let update = true

        try{
            for(let key in this.assetsValues){  
                if (this.assetsValues[key].valueBTC != 0){       
                    valueBTC += this.assetsValues[key].quantity * this.assetsValues[key].valueBTC
                    console.log(key + ': ' + valueBTC)
                }
                else update = false
                
            }
            console.log(this.state.assets.length)
        }
        catch(e){
            console.log('Failed updating values of assets : ' + e)
        }
        
        (update)?this.setState({totalValueBTC: valueBTC}):null
    }

    render(){
        return (  
            <Grid style={{width:'100%'}}>
                <Row>      
                    <Col sm={3} md={3} lg={3}><SummaryView symbols={this.state.numberSymbols} totalValueBTC={this.state.totalValueBTC}/></Col>
                    <Col sm={9} md={9} lg={9}><DetailsView/></Col>
                </Row>
                <Row>
                    <Col sm={12} md={12} lg={12}><ContentView assets={this.state.assets} openOrders={this.state.openOrders}/></Col>
                </Row>
            </Grid>
        )

    }
}


