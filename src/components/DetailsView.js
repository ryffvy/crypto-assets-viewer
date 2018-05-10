import React, {Component} from 'react'
import { LineChart, PieChart } from 'react-chartkick'

export function DetailsView(props){

    let assets = props.portfolio
    let totalValue = (assets.length > 0)?assets.reduce((total, asset) => { return total + asset.valueBTC}, 0):0

    return (
        <PieChart data={props.portfolio.map(asset => (asset.valueBTC >= 0.01*totalValue)?[asset.symbol, asset.valueBTC]:[])} height="240px" />
    )
}