import React, {Component} from 'react'
const path = require('path')
const binanceAPI = require(__dirname + '/../scripts/binanceAPICalls.js')

export function SummaryView(props){
    return (
        <div>
            <h3>Summary: </h3>
            <p>Total Asset Value: {(props.totalValueBTC)?props.totalValueBTC.toFixed(6) + ' BTC':'loading...'}</p> 
            <p>Number of Symbols: {props.symbols}</p>
        </div>
    )
}
