import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import LineChart from './charts/LineChart';
import { convert } from 'cashify';


const App = () => {
  const [userData, setUserData] = useState(new Object);
  const [filled, setFilled] = useState();


  //rates for currencies offered by product grid, CAD as base and sourced from google
  const rates = {
    CAD: 1.00,
    USD: 0.80,
    GBP: 0.61,
    EUR: 0.73,
    AUD: 1.07,
    NZD: 1.15,
    SGD: 1.09,
    HKD: 6.27
  }

  //buttons to empty and repopulate DB for testing
  const fillData = async () => {
    axios.get("http://localhost:8000/")
      .then(res => {
        setFilled(true)
      })
      .catch(err => {
        console.log(err)
      })
  }

  const clearData = async () => {
    axios.get("http://localhost:8000/delete")
    .then(res => {
      setFilled(false)
    })
    .catch(err => {
      console.log(err)
    })
  }

  //gets the necessary data to generate the graphs
  const getData = async (e) => {
    
    //Switch case depending on what graph needs to be rendered
    switch (e.target.value) {
      case "marketing":
        axios.get(`http://localhost:8000/marketingChart`)
        .then(res => {
          setUserData({
            labels: res.data.map(week => "Week "+week.id),
            datasets: [{
              label: "Number of Website Visitors Per Week of the Year",
              data: res.data.map(week => week.WebVisitors),
              borderColor: 'black',
              borderWidth: 1,
              backgroundColor: 'rgba(255, 99, 132, 1)',
            }]
          })
        })
        .catch(err => {
          console.log(err)
        })
        break;
      case "fulfillments":
        axios.get(`http://localhost:8000/fulfillmentsChart`)
          .then(res => {
            setUserData({
              labels: res.data.map(order => order.dateCreated.slice(0,10)),
              datasets: [{
                label: "Number of Fulfillments Per Order",
                data: res.data.map(order => order.fulfillments),
                borderColor: 'black',
                borderWidth: 1,
                backgroundColor: 'rgba(255, 99, 132, 1)',
              }]
            })
          })
          .catch(err => {
            console.log(err)
          })
        break;
      case "itemsSold":
        let total = 0
        axios.get(`http://localhost:8000/itemsSoldChart`)
          .then(res => {
            setUserData({
              labels: res.data.map(order => order.dateCreated.slice(0,10)),
              datasets: [{
                label: "Number of Total Items Sold at Date",
                //Object.values returns an array of the number of ordered item, this array is summed and then the summed value is pushed into the map array
                //a+b still works for objects that have more than 2 values
                data: res.data.map(order => total+=(Object.values(JSON.parse(order.lineItems)).reduce((a,b) => a+b,0))),
                borderColor: 'black',
                borderWidth: 1,
                backgroundColor: 'rgba(255, 99, 132, 1)',
              }],
            })
          })
          .catch(err => {
            console.log(err)
          })
        
        total = 0
        break;
        case "ordersPlaced":
          let total2 = 0
          axios.get(`http://localhost:8000/ordersPlacedChart`)
            .then(res => {
              setUserData({
                labels: res.data.map(order => order.dateCreated.slice(0,10)),
                datasets: [{
                  label: "Number of Total Orders at Date",
                  data: res.data.map(order => total2++),
                  borderColor: 'black',
                  borderWidth: 1,
                  backgroundColor: 'rgba(255, 99, 132, 1)',
                }]
              })
            })
            .catch(err => {
              console.log(err)
            })
          total2 = 0
          break;
        case "salesRevenue":
          let total3 = 0
          axios.get(`http://localhost:8000/salesRevenueChart`)
          .then(res => {
            setUserData({
              labels: res.data.map(order => order.dateCreated.slice(0,10)),
              datasets: [{
                label: "Total Sales Revenue at Date",
                data: res.data.map(order => total3+=convert(order.total, {from: order.isoCurrency, to: 'CAD', base: 'CAD', rates})),
                borderColor: 'black',
                borderWidth: 1,
                backgroundColor: 'rgba(255, 99, 132, 1)',
              }]
            })
          })
          .catch(err => {
            console.log(err)
          })
        total3 = 0
        break;
      }  
  };
  
  //Disallow user from overpopulating the DB
  const emptyCheck = async () => {
    axios.get('http://localhost:8000/emptyCheck')
    .then(res => {
      res.data?.length && setFilled(true)
    })
    .catch(err => {
      console.log(err)
    })
  }

  //check if DB is empty or populated
  useEffect(() =>{
    emptyCheck()
  },[userData])

  return (
    <div>
      <div style={{textAlign: 'center'}}>

        {!filled && <button onClick={fillData}>Populate DB</button>}
        <button onClick={clearData}>Clear DB</button>

        <form>
          <select onChange={getData}>
            <option value="salesRevenue">Sales Revenue</option>
            <option value="itemsSold">Quantity: Items Sold</option>
            <option value="ordersPlaced">Quantity: Orders Placed</option>
            <option value="fulfillments">Number of Fulfillments</option>
            <option value ="marketing">Number of Website Visitors</option>
          </select>
        </form>
      </div>

      {userData?.labels && <LineChart chartData={userData}/>}
    </div>
  )
}

export default App;