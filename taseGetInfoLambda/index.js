const zlib = require('zlib');
const https = require('https');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const csvStringToArray = (strData, header=true) =>
{
    //const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"((?:\\\\.|\"\"|[^\\\\\"])*)\"|([^\\,\"\\r\\n]*))"),"gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData)){
        if (arrMatches[1].length && arrMatches[1] !== ",") arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ? 
            arrMatches[2].replace(new RegExp( "[\\\\\"](.)", "g" ), '$1') :
            arrMatches[3]);
    }
    if (header) {
        let hData = arrData.shift();
        let hashData = arrData.map(row => {
            let i = 0;
            return hData.reduce(
                (acc, key) => { 
                    acc[key] = row[i++]; 
                    return acc; 
                },
                {}
            );
        });
        return hashData;
    } else {
        return arrData;
    }
}

function win1255ToUtf8(buf) {
	const arr = [
            [0xe2,0x82,0xac], [0xef,0xbf,0xbd], [0xe2,0x80,0x9a], [0xc6,0x92],
            [0xe2,0x80,0x9e], [0xe2,0x80,0xa6], [0xe2,0x80,0xa0], [0xe2,0x80,0xa1],
            [0xcb,0x86], [0xe2,0x80,0xb0], [0xef,0xbf,0xbd], [0xe2,0x80,0xb9],
            [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd],
            [0xef,0xbf,0xbd], [0xe2,0x80,0x98], [0xe2,0x80,0x99], [0xe2,0x80,0x9c],
            [0xe2,0x80,0x9d], [0xe2,0x80,0xa2], [0xe2,0x80,0x93], [0xe2,0x80,0x94],
            [0xcb,0x9c], [0xe2,0x84,0xa2], [0xef,0xbf,0xbd], [0xe2,0x80,0xba],
            [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd],
            [0xc2,0xa0], [0xc2,0xa1], [0xc2,0xa2], [0xc2,0xa3], [0xe2,0x82,0xaa],
            [0xc2,0xa5], [0xc2,0xa6], [0xc2,0xa7], [0xc2,0xa8], [0xc2,0xa9],
            [0xc3,0x97], [0xc2,0xab], [0xc2,0xac], [0xc2,0xad], [0xc2,0xae],
            [0xc2,0xaf], [0xc2,0xb0], [0xc2,0xb1], [0xc2,0xb2], [0xc2,0xb3],
            [0xc2,0xb4], [0xc2,0xb5], [0xc2,0xb6], [0xc2,0xb7], [0xc2,0xb8],
            [0xc2,0xb9], [0xc3,0xb7], [0xc2,0xbb], [0xc2,0xbc], [0xc2,0xbd],
            [0xc2,0xbe], [0xc2,0xbf], [0xd6,0xb0], [0xd6,0xb1], [0xd6,0xb2],
            [0xd6,0xb3], [0xd6,0xb4], [0xd6,0xb5], [0xd6,0xb6], [0xd6,0xb7],
            [0xd6,0xb8], [0xd6,0xb9], [0xef,0xbf,0xbd], [0xd6,0xbb], [0xd6,0xbc],
            [0xd6,0xbd], [0xd6,0xbe], [0xd6,0xbf], [0xd7,0x80], [0xd7,0x81],
            [0xd7,0x82], [0xd7,0x83], [0xd7,0xb0], [0xd7,0xb1], [0xd7,0xb2],
            [0xd7,0xb3], [0xd7,0xb4], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd],
            [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd],
            [0xef,0xbf,0xbd], [0xd7,0x90], [0xd7,0x91], [0xd7,0x92], [0xd7,0x93],
            [0xd7,0x94], [0xd7,0x95], [0xd7,0x96], [0xd7,0x97], [0xd7,0x98],
            [0xd7,0x99], [0xd7,0x9a], [0xd7,0x9b], [0xd7,0x9c], [0xd7,0x9d],
            [0xd7,0x9e], [0xd7,0x9f], [0xd7,0xa0], [0xd7,0xa1], [0xd7,0xa2],
            [0xd7,0xa3], [0xd7,0xa4], [0xd7,0xa5], [0xd7,0xa6], [0xd7,0xa7],
            [0xd7,0xa8], [0xd7,0xa9], [0xd7,0xaa], [0xef,0xbf,0xbd], [0xef,0xbf,0xbd],
            [0xe2,0x80,0x8e], [0xe2,0x80,0x8f], [0xef,0xbf,0xbd],
	]
	let a=[]
	for (var i of buf.values()) {
		//console.log('BUF',i)
		if (i<0x80) a.push(i)
		else {
			arr[i-0x80].forEach(x=>a.push(x))
		}
	}
	return Buffer.from(a).toString()
}

function request(options) {
	return new Promise(function(resolve, reject) {
		let	headers = Object.assign({
			'accept-charset' : 'utf-8;q=0.7,*;q=0.3',
	        'Accept-Language': 'en-Us,en;q=0.5',
			'User-Agent':'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	        'Accept-Encoding': 'gzip, deflate, br',
	        'Host': 'info.tase.co.il',
	        'encoding': 'binary',
	        'method': 'GET'
		}, options.headers || {})
		//console.log('HEADERS',headers)
		let opts = Object.assign(
			{}, {
				host: 'info.tase.co.il',
		        setHost: false,
		        port: 443,
			}, 
			options,
			{ 
				headers: headers 
			}
		)
		https.get(opts,	function(res) {
			console.log("Got response: " + res.statusCode);
			if (res.statusCode >= 400) {
				reject(new Error(`http error ${res.statusCode}`))
			}
			const encoding = res.headers['content-encoding'];
			if (encoding == 'gzip') {
				let buffer=[]
				let x=0
				var gunzip = zlib.createGunzip();
	            res.pipe(gunzip);
				gunzip.on('data', (chunk) => {
					buffer.push(win1255ToUtf8(chunk));
				}).on('end', () => {
					let data = buffer.join('')
					resolve({
						data,
						headers: res.headers 
					})
				}).on("error", function (e) {
                	reject(e);
            	});
			}
			else {
				res.setEncoding('utf8');
				let buffer=[];
				res.on('data', chunk => {
					buffer.push(chunk.toString());
				}).on('end', () => {
					resolve({
						data: buffer.join(''),
						headers: res.headers
					})
				})
			}
		}).on('error', e=>reject(e));
	})	
}

function s3InsertPromise(res, columns, date, dateNow, humanDate) {
	var s3 = new AWS.S3();
	return Promise.all([
		s3.putObject({
			Bucket: process.env.STOCKS_BUCKET,
			Key: `${process.env.STOCKS_TABLE}/tase_${date}`,
			Body: res,
			ContentType: 'application/csv'
		}).promise()
	])
}

function firehoseInsertPromise(res, columns, date, dateNow, humanDate) {
    const firehose = new AWS.Firehose();
    return Promise.all([
        firehose.putRecord({
            DeliveryStreamName: process.env.STOCKS_DELIVERY_STREAM_NAME,
            Record: { 
                Data: res
            }
        }).promise()
    ])
}
exports.handler = async (event) => {
	let lang={
		english: '{85603D39-703A-4619-97D9-CE9F16E27615}',
		hebrew: '{26F9CCE6-D184-43C6-BAB9-CF7848987BFF}'
	}
	let result = await request({
		path: `/_layouts/Tase/ManagementPages/Export.aspx?sn=none&GridId=33&AddCol=1&Lang=en-US&CurGuid=${lang['english']}&action=1&dualTab=&SubAction=0&date=&ExportType=3`
	}).then(({data, headers})=>{
		let cookies = headers['set-cookie'].map(c=>c.split(';')[0]).filter(x=>x.match(/^[A-z_0-9=]+$/)).join(';')
		return request({
			path: headers['location'],
			headers: {
				Cookie: cookies
			}
		}) 
	}).then(({data})=>{
		let headerSize = data.indexOf('\n',data.indexOf('\n',data.indexOf('\n')+1)+1)+1
		let humanDate = data.substr(0,headerSize).match(/([0-9][0-9]).([0-9][0-9]).(20[0-9][0-9])/)
		let date = (new Date(`${humanDate[2]}/${humanDate[1]}/${humanDate[3]} GMT`).getTime()/86400000)+1
		let dateNow = ''+Math.floor(Date.now()/86400000)
		data = data.substr(headerSize)
		let res = csvStringToArray(data, false)
		let columns = res.shift().map(v=>v.trim())
		return s3InsertPromise(data, columns, date, dateNow, humanDate)
		return Promise.all(res.map(quote=>{
			let values = columns.map((v,index)=>({[v]:{S:quote[index]?quote[index]:'EMPTY'}}))
			return new Promise( (resolve, reject) => dynamodb.putItem({
				"TableName": process.env.STOCKS_TABLE,
				"Item" : Object.assign({
					'Name': {
						S: quote[0]
					},
					'Date': {
						S: ''+date
					},
					'_Now': {
						N: dateNow
					},
					'_HumanDate': {
						S: humanDate[0]
					}
				}, ...values)
			}, (err, data) => {
				resolve({err, data, quote})
			}) )
		}))
	}).then(dbResults => {
		let dbErrors=dbResults.filter(res=>(res.err != null))
		console.log('DB ERRORS', dbErrors)
		return {
        		statusCode: 200,
        		body: {dbErrors},
    		}
	}).catch(e=>{
		console.log('EXCEPTION', e)
		return {
        		statusCode: 200,
        		body: e,
    		}
	})
	return result
}






