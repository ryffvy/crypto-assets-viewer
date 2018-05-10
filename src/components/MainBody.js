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
    openTrades: callLimit,
    valuesBTC: 1
} 
const callPriorities = {
    assets: 0,
    symbols: 0,
    openTrades: 2,
    valuesBTC: 0
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

        this.binancePricesBTC = {BTC: 1}
        this.assets = new Object()

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
        this.updateTotalValue = this.updateTotalValue.bind(this)
        this.processPricesBTC = this.processPricesBTC.bind(this)
    }

    componentDidMount(){
        
        this.scheduleAssetsCall()
        this.scheduleOpenOrdersCall()
        this.schedulePricesBTCCall()
        this.makeCalls()        

        this.timers.makeCalls = setInterval(this.makeCalls, 1100)
        
        this.timers.scheduleAssets = setInterval(this.scheduleAssetsCall, 60000)

        this.timers.scheduleOpenOrders = setInterval(this.scheduleOpenOrdersCall, 20000)

        this.timers.schedulePricesBTCCall = setInterval(this.schedulePricesBTCCall, 5000)
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
        console.log("Scheduled Open Orders Rertieval")
    }

    /**
     * Places a call for retrieval of assets values of all symbols 
     * 
     */
    schedulePricesBTCCall = () => {
        if(this.callsQueue){
            this.callsQueue.queue({
                function: this.binance.getPricesInBTC,
                callback: this.processPricesBTC,
                time: Date.now(),
                priority: callPriorities.valuesBTC,
                weight: callWeights.valuesBTC,
            })
        }
        console.log("Scheduled All Prices in BTC")
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

        try{
            this.assets = res.filter((asset) => asset.totalBalance > 0)
        }catch(e){
            console.log('Failed processing assets: ' + e)
        }
    }

    /**
     * Handles received response after making API call to Binance to get values in BTC.
     * 
     * @param {Object} res - response from Binance in format : {symbol: , price: }
     */
    processPricesBTC(res){
        try{
            res.forEach((entry) => {
                
                let symb = (entry.symbol === 'BTCUSDT')?'USDT':entry.symbol.substring(0, entry.symbol.length - 3)

                if (entry.symbol.substring(entry.symbol.length - 3, entry.symbol.length) === 'BTC' || symb == 'USDT') {
                    this.binancePricesBTC[symb] = (symb === 'USDT')?1/(Number(entry.price)):Number(entry.price)
                }
            })

            this.updateTotalValue()
        }
        catch(e){
            console.log("Failed to process values in BTC: " + e)
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
            clearInterval(this.timers.scheduleOpenOrders)
            clearInterval(this.timers.makeCalls)
            clearInterval(this.timers.schedulePricesBTCCall)
            console.log("Stopped making calls.")
        }
        catch(e){
            console.log("Failed stop making calls: " + e)
        }
    }

    /**
     * Updates the state with new total assets value
     * 
     */
    updateTotalValue(){
        let totalValueBTC = 0
        let portfolio = this.assets

        // Update BTC values
        for(let i in portfolio){
            if(this.binancePricesBTC[portfolio[i].symbol]){
                portfolio[i].valueBTC = portfolio[i].totalBalance * this.binancePricesBTC[portfolio[i].symbol]
            }
            else {
                totalValueBTC = this.state.totalValueBTC
                break
            }
        }

        // Calculate total values
        if (portfolio){
            portfolio.forEach((asset) => {
                totalValueBTC += asset.valueBTC
            })
        }

        
        this.setState({assets: portfolio})
        this.setState({totalValueBTC: totalValueBTC})
    }

    render(){
        return (  
            <Grid style={{width:'100%'}}>
                <Row>      
                    <Col sm={3} md={3} lg={3}><SummaryView symbols={this.state.numberSymbols} totalValueBTC={this.state.totalValueBTC}/></Col>
                    <Col sm={9} md={9} lg={9}><DetailsView portfolio={this.state.assets}/></Col>
                </Row>
                <Row>
                    <Col sm={12} md={12} lg={12}><ContentView assets={this.state.assets} openOrders={this.state.openOrders}/></Col>
                </Row>
            </Grid>
        )

    }
}


