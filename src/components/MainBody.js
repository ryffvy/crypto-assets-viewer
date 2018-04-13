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
            openOrders : [],
        }

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
    }

    componentDidMount(){
        
        this.scheduleAssetsCall()
        this.scheduleSymbolsCall()
        this.scheduleOpenOrdersCall()
        this.makeCalls()        

        this.timers.makeCalls = setInterval(this.makeCalls, 1000)
        
        this.timers.scheduleAssets = setInterval(this.scheduleAssetsCall, 2000)

        this.timers.scheduleSymbols = setInterval(this.scheduleSymbolsCall, 2000)

        this.timers.scheduleOpenOrders = setInterval(this.scheduleOpenOrdersCall, 2000)
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
     * @param {Object} symbols - response from Binance
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
     * @param {Object} symbols - response from Binance
     */
    processAssets(res){
        console.log('Received Assets')

        try{
            this.setState({
                assets : res
            })
        }catch(e){
            console.log('Failed processing assets: ' + e)
        }
    }

    /**
     * Handles received response after making API call to Binance to get open orders.
     * 
     * @param {Object} symbols - response from Binance
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


    render(){
        return (  
            <Grid style={{width:'100%'}}>
                <Row>      
                    <Col sm={3} md={3} lg={3}><SummaryView symbols={this.state.numberSymbols}/></Col>
                    <Col sm={9} md={9} lg={9}><DetailsView/></Col>
                </Row>
                <Row>
                    <Col sm={12} md={12} lg={12}><ContentView assets={this.state.assets} openOrders={this.state.openOrders}/></Col>
                </Row>
            </Grid>
        )

    }
}


