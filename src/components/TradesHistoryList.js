import React from 'react'
import 'react-table/react-table.css'
import ReactTable from 'react-table'

export function TradesHistoryList(props){

    const data = []

    const columns = [{
        accessor: 'pair',
        Header: 'Trading Pair'
    }, {
        accessor: 'price',
        Header: 'Price'
    }, {
        accessor: 'quantity',
        Header: 'Quantity'
    }, {
        accessor: 'time',
        Header: 'Time'
    }]

    return (
        <div><p></p><ReactTable data={data} columns={columns} style={{height: "440px"}} 
        showPagination={false} pageSize={data.length}/></div>
      )
}


