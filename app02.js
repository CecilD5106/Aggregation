const Request = require('request');
const Hapi = require('hapi');

const server = Hapi.Server({
    port: 4000,
    host: 'localhost'
});

let maxCount = 0;
let nameObj;
let nameID = 0;
let districtID = 0;

let addressLn1 = '';

let name = function () {
    let url1 = 'http://localhost:3001/getName/Davis';
    let promise = new Promise((resolve, reject) => {
        Request.get(url1, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                let myName = JSON.parse(body);
                maxCount = Object.keys(myName).length;
                let nameText = '[';
                for (let i = 0; i < maxCount; i++) {
                    nameText = nameText + '{"nameid" : ' + myName[i].name_id + ', ' +
                    '"addressLn1" : ' + '"' + myName[i].first_name + ' ' + myName[i].last_name + '"}'

                    if ((i + 1 ) != maxCount){
                        nameText = nameText + ','
                    }
                }
                nameText = nameText + ']';
                nameObj = JSON.parse(nameText);
                resolve(nameObj);
            }
        });
    });
    return promise;
}

let address = function () {
    let url1 = 'http://localhost:3002/getAddress/' + nameID;
    let promise = new Promise((resolve, reject) => {
        Request.get(url1, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                let myAddress = JSON.parse(body);
                maxCount = Object.keys(myAddress).length;
                let addressText = '';
                for (let j = 0; j < maxCount; j++) {
                    addressText = addressText + '{"districtid" : ' + myAddress[j].district_id + ', ' +
                        '"addressLn1" : "' + addressLn1 + '", ' +
                        '"addressLn2" : "' + myAddress[j].address_ln1 + '", ' +
                        '"addressLn3" : "' + myAddress[j].address_ln2 + '"}'

                    if ((j + 1) != maxCount) {
                        addressText = addressText + ',';
                    }
                }
                resolve(addressText);
            }
        });
    });
    return promise;
}

let district = function () {
    let url1 = 'http://localhost:3000/getCity/' + districtID;
    let promise = new Promise((resolve, reject) => {
        Request.get(url1, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                let myCity = JSON.parse(body);
                let txt = myCity[0].city + ', ' + myCity[0].state + ' ' + myCity[0].zip;
                resolve(txt);
            }
        });
    });
    return promise;
}

async function getAddress() {
    console.time('test');
    //Query database for name information
    let myNameObj = await name();
    //Get JSON object count for name information
    let count1 = Object.keys(myNameObj).length;
    //Text to create JSON from Name and Address Tables
    let txt1 = '';
    for (let i = 0; i < count1; i++) {
        //Query Address table based on nameID (Foreign Key)
        nameID = myNameObj[i].nameid;
        addressLn1 = myNameObj[i].addressLn1;
        let myTxt = await address();
        txt1 = txt1 + myTxt;
    }
    //Format name and address information as JSON
    txt1 = '[' + txt1 + ']';
    let myAddressObj = JSON.parse(txt1);
    //Assign the number of addresses to count2
    let count2 = Object.keys(myAddressObj).length;
    //Text to create JSON from Name, Address and District Tables
    let txt2 = '';
    for (let j = 0; j < count2; j++) {
        //Get districtID from record in Address table
        districtID = myAddressObj[j].districtid;
        //Format text for JSON Address text
        txt2 = txt2 + '{"addressLn1" : "' + myAddressObj[j].addressLn1 + '", "addressLn2" : "' +
        myAddressObj[j].addressLn2 + '", "addressLn3" : "' + myAddressObj[j].addressLn3 + '"'
        //Get information from the District table
        let myTxt2 = await district();
        //Add the city, state and zip to the JSON Address text
        txt2 = txt2 + ', "addressLn4" : "' + myTxt2 + '"}';

        //Add comma separator after the address if there is an additional address
        if ((j + 1) != count2) {
            txt2 = txt2 + ', ';
        }
    }
    //Format text as JSON
    txt2 = '[' + txt2 + ']';
    result = JSON.parse(txt2);
    //Return the Addresses
    console.timeEnd('test');
    return result;
}

server.route({
    method: 'GET',
    path: '/getAddress',
    handler: (request, h) => {
        let myReturnedAddress = getAddress();
        return myReturnedAddress;
    }
});

const init = async () => {
    await server.start();
    console.log('Server started.')
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();