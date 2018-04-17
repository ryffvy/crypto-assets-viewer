import React from 'react'
import 'react-table/react-table.css'
import ReactTable from 'react-table'

export function OpenOrdersList(props){

    const openOrders = (props.openOrders)?props.openOrders:[]

    const columns = [{
        accessor: 'symbol',
        Header: 'Trading Pair'
    }, {
        accessor: 'price',
        Header: 'Price'
    }, {
        accessor: 'quantity',
        Header: 'Quantity'
    }, {
        accessor: 'type',
        Header: 'Type'
    }, {
        accessor: 'time',
        Header: 'Time'
    }, {
        accessor: 'id',
        Header: 'Order ID'
    }]

    return (
        <div><p></p><ReactTable data={openOrders} columns={columns} style={{height: "525px"}} 
      showPagination={false} pageSize={openOrders.length}/></div>)
}