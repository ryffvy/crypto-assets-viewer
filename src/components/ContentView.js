import React from 'react'
import {Tabs, Tab} from 'react-bootstrap'
import {OpenOrdersList} from './OpenOrdersList.js'
import {TradesHistoryList} from './TradesHistoryList.js'
import {AssetsList} from './AssetsList.js'

export function ContentView(props){
    const t = props.time
    return (
        <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example">
            <Tab eventKey={1} title="Assets">
                <AssetsList assets={props.assets}/>
            </Tab>
                
            <Tab eventKey={2} title="Trade History">
                <TradesHistoryList/>
            </Tab>

            <Tab eventKey={3} title="Open Trades">
                <OpenOrdersList openOrders={props.openOrders}/>
            </Tab>
        </Tabs>
    )
}