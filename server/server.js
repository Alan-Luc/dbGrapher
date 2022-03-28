const http = require('http');
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const JSON5 = require('json5');
const keys = require("./keys");
const fs = require('fs');
const cors = require('cors');
//const marketingData = require("./marketingData.json");
//const productGrid = require('./productGrid.json');

//set up server
const app = express();
const server = http.createServer(app);
app.use(bodyParser.urlencoded({extended: true}));

//set up cors to allow cross origin requests
const corsOptions = {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Access-Control-Allow-Origin", "Content-Type", "Access-Control-Allow-Credentials"],
    credentials: true,
};

app.use(cors(corsOptions));

//require reads as json, doesnt allow parsing since there are trailing commas
//read file then parse using json5 which allows parsing with trailing commas
const obj = JSON5.parse(fs.readFileSync(__dirname + '/marketingData.json', 'utf8'));
const obj2 = JSON5.parse(fs.readFileSync(__dirname + '/productGrid.json', 'utf8'));
let obj3 = fs.readFileSync(__dirname + '/salesOrders.json', 'utf-8');


// used regex to remove incorrect json syntax to make the file parseable
const regex1 = /("fulfillments"\s*:\s*)[\s\\{\S]*?}/g
const regex2 = /("payments"\s*:\s*)[\s\\{\S]*?}/g


// record regex matches to replace
let result = [...obj3.matchAll(regex1)];
let result2 = [...obj3.matchAll(regex2)];


//store number of fulfillments and payments using regex matches
let fulfillments = [];
let payments = [];

for(let i = 0; i<result.length; i++) {
    fulfillments.push(result[i][0].match(/]/g)?.length)
    payments.push(result2[i][0].match(/]/g)?.length)
}

//replace regex matches with empty string so file is parseable
obj3 = obj3.replace(regex1, '$1""')
obj3 = obj3.replace(regex2, '$1""')
obj3 = JSON5.parse(obj3)


//set up mysql connection
const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "44Sm5Zq9!",
    database: "alandb",
});

//connect to mysql
db.connect((err)=>{
    if(err) {
        console.error('error connecting' + err.stack)
        return;
    }
    console.log("connected to db!")
})

//empty all tables in the db
app.get('/delete', (req, res) => {
    res.send("delete")
    db.query('DELETE FROM marketing_data', 
        (err, res) => {
            if (err) {
                console.log("error ", err);
                return;
            }
    })
    db.query('DELETE FROM product_grid', 
        (err, res) => {
            if (err) {
                console.log("error ", err);
                return;
            }
    })
    db.query('DELETE FROM product_grid_pack_data', 
        (err, res) => {
            if (err) {
                console.log("error ", err);
                return;
            }
    })
    db.query('DELETE FROM product_grid_price_data', 
        (err, res) => {
            if (err) {
                console.log("error ", err);
                return;
            }
    })
    db.query('DELETE FROM sales_orders', 
        (err, res) => {
            if (err) {
                console.log("error ", err);
                return;
            }
    })
});

app.get('/', (req, res) => {
    let key = Object.keys(obj.marketingData)

    //Takes marketing object and populates table by cycling through each week/entry
    Object.keys(obj.marketingData).map(entry => {
        db.query(
            'INSERT INTO marketing_data VALUES (?, ?, ?, ?)', 
            [
                parseInt(entry.slice(4)), 
                obj.marketingData[entry].dateCreated, 
                obj.marketingData[entry].webVisitors, 
                obj.marketingData[entry].prClippings
            ], 
            (err, res) => {
                if (err) {
                    console.log("error ", err);
                    return;
                }
            }
        );
    });
    res.send("get")

    //query using same idea as marketing
    Object.keys(obj2.productSKU).map(entry => {
        db.query(
            'INSERT INTO product_grid VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [
                obj2.productSKU[entry].barcode,  
                obj2.productSKU[entry].parentSku, 
                obj2.productSKU[entry].regionCode, 
                obj2.productSKU[entry].itemType,
                obj2.productSKU[entry].supplier,
                obj2.productSKU[entry].brand,
                obj2.productSKU[entry].variantName, 
                obj2.productSKU[entry].shortDesc,
                obj2.productSKU[entry].stockLink,
                obj2.productSKU[entry].lastUpdated,
                entry
            ], 
            (err, res) => {
                if (err) {
                    console.log("error ", err);
                    return;
                }
            }
        )
    });

    //query using same idea as marketing
    Object.keys(obj2.productSKU).map(entry => {
        db.query(
            'INSERT INTO product_grid_pack_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [
                obj2.productSKU[entry].packData.packType,  
                obj2.productSKU[entry].packData.components.toString(), 
                obj2.productSKU[entry].packData.Metric['LMM'], 
                obj2.productSKU[entry].packData.Metric['WMM'],
                obj2.productSKU[entry].packData.Metric['HMM'],
                obj2.productSKU[entry].packData.Metric['GWG'],
                obj2.productSKU[entry].packData.Metric['NWG'], 
                obj2.productSKU[entry].packData.Metric['CBM'],
                obj2.productSKU[entry].packData.Imperial['LIN'],
                obj2.productSKU[entry].packData.Imperial['WIN'],
                obj2.productSKU[entry].packData.Imperial['HIN'],
                obj2.productSKU[entry].packData.Imperial['GWLB'],
                obj2.productSKU[entry].packData.Imperial['NWLB'],
                obj2.productSKU[entry].packData.Imperial['CBFT'],
                entry,
                obj2.productSKU[entry].barcode,
            ], 
            (err, res) => {
                if (err) {
                    console.log("error ", err);
                    return;
                }
            }
        )
    });


    //query using same idea as marketing
    Object.keys(obj2.productSKU).map(entry => {
        db.query(
            'INSERT INTO product_grid_price_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [
                obj2.productSKU[entry].priceData.Buy['BOMUSD'],  
                obj2.productSKU[entry].priceData.Buy.buyCanadaUSD, 
                obj2.productSKU[entry].priceData.Buy.buyFranceUSD, 
                obj2.productSKU[entry].priceData.Buy.buyHongKongUSD,
                obj2.productSKU[entry].priceData.Sell['CAD'],
                obj2.productSKU[entry].priceData.Sell['USD'],
                obj2.productSKU[entry].priceData.Sell['GBP'], 
                obj2.productSKU[entry].priceData.Sell['EUR'],
                obj2.productSKU[entry].priceData.Sell['AUD'],
                obj2.productSKU[entry].priceData.Sell['NZD'],
                obj2.productSKU[entry].priceData.Sell['SGD'],
                obj2.productSKU[entry].priceData.Sell['HKD'],
                entry,
                obj2.productSKU[entry].barcode,
            ], 
            (err, res) => {
                if (err) {
                    console.log("error ", err);
                    return;
                }
            }
        )
    });
    let obj3Arr = Object.keys(obj3.salesOrders)
    //query using same idea as marketing
    obj3Arr.map(entry => {
        db.query(
            'INSERT INTO sales_orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [
                obj3.salesOrders[entry].dateCreated,  
                obj3.salesOrders[entry].salesChannel, 
                obj3.salesOrders[entry].isoCurrency, 
                obj3.salesOrders[entry].subtotal,
                obj3.salesOrders[entry].discountAmt,
                obj3.salesOrders[entry].shipping,
                JSON.stringify(obj3.salesOrders[entry].taxes), 
                obj3.salesOrders[entry].taxType,
                obj3.salesOrders[entry].total,
                JSON.stringify(obj3.salesOrders[entry].lineItems),
                fulfillments[obj3Arr.indexOf(entry)],
                payments[obj3Arr.indexOf(entry)],
                entry
            ], 
            (err, res) => {
                if (err) {
                    console.log("error ", err);
                    return;
                }
            }
        )
    });

})

//chart data population routes
app.get('/marketingChart', (req, res) => {
    db.query('SELECT id, WebVisitors FROM marketing_data', 
        (err, data) => {
            if (err) {
                console.log("error ", err);
                return;
            }
            res.send(data)
        }  
    );
})

app.get('/fulfillmentsChart', (req, res) => {
    db.query('SELECT dateCreated, fulfillments FROM sales_orders', 
        (err, data) => {
            if (err) {
                console.log("error ", err);
                return;
            }
            res.send(data)
        }  
    );
})

app.get('/itemsSoldChart', (req, res) => {
    db.query('SELECT dateCreated, lineItems FROM sales_orders', 
        (err, data) => {
            if (err) {
                console.log("error ", err);
                return;
            }
            res.send(data)
        }  
    );
})

app.get('/ordersPlacedChart', (req, res) => {
    db.query('SELECT dateCreated, lineItems FROM sales_orders', 
        (err, data) => {
            if (err) {
                console.log("error ", err);
                return;
            }
            res.send(data)
        }  
    );
})

app.get('/salesRevenueChart', (req, res) => {
    db.query('SELECT isoCurrency, total, dateCreated FROM sales_orders', 
        (err, data) => {
            if (err) {
                console.log("error ", err);
                return;
            }
            res.send(data)
        }  
    );
})

//Disallow user from overpopulating the db
app.get('/emptyCheck', (req, res) => {
    db.query('SELECT 1 FROM marketing_data WHERE id = 1', 
        (err, data) => {
            if (err) {
                console.log('error ', err)
                return;
            }
            res.send(data)
        }
    )
})

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
});