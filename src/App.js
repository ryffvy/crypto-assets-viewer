import React, { Component } from 'react';
import './App.css';
import {Sidebar} from './components/Sidebar.js'
import {MainBody} from './components/MainBody.js'
import {Grid, Row, Col, Jumbotron} from 'react-bootstrap'

var keys = null

try{
    keys = require(__dirname + '/assets/apiKeys.json')
}
catch(e){
    console.log("Failed to load apiKeys.json.")
}

class App extends Component {
  render() {

    if (keys)
      return (
        <Grid fluid={true} style={{'width': '100vw'}}>
          <Row>
            <Col sm={2} md={2} lg={2} xl={1} style={{'backgroundColor':'#324b72', 'height': '100vh'}}><Sidebar/></Col>
            <Col sm={10} md={10} lg={10} xl={11}><MainBody api_key = {keys[0].api_key} api_secret = {keys[0].api_secret}/></Col>
          </Row>
        </Grid>
      );
    else return (
        <Jumbotron style={{'text-align': 'center'}}>
        <h1>API keys file not found.</h1>
        <p>
          Please place your apiKeys.json file in app/src/assets folder.
        </p>
      </Jumbotron>
      
    )
  }
}

export default App;
