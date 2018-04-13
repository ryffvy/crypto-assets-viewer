import React from 'react'
import 'react-table/react-table.css'
import ReactTable from 'react-table'

export function AssetsList(props){
    
    const assets = props.assets

    const columns = [{
        accessor: 'symbol',
        Header: 'Asset'
    }, {
        accessor: 'freeBalance',
        Header: 'Free Balance'
    }, {
        accessor: 'lockedBalance',
        Header: 'Locked Balance'
    }, {
        accessor: 'totalBalance',
        Header: 'Total'
    }]

    return (
      <div><p></p><ReactTable data={assets} columns={columns} style={{height: "525px"}} 
      showPagination={false} pageSize={assets.length}/></div>
    )
}