require('dotenv').config({ path: __dirname + '/.env' })
const express = require("express");
const multer = require('multer');

//middleware
const convertFromJson = multer();
const data = require('./store');
const app = express();
//const upload = multer();

app.use(express.json({ extended: false }));
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');

const tableName = 'company';

//config aws dynamodb
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
})

const docClient = new AWS.DynamoDB.DocumentClient();

app.get('/', (request, respone) => {
    //query database
    const params = {
        TableName: tableName,
    };
    docClient.scan(params, (err, data) => {
        if (err) {
            return respone.send('Internal server error');
            //console.log(err);
        }

        return respone.render('index', { data: data.Items });
    });

});

app.get('/:company_id', (req, res) => {
    const { company_id } = req.params;
    var params = {
        TableName: tableName,
        KeyConditionExpression: "#id = :company_id",
        ExpressionAttributeNames: {
            "#id": "ma_company"
        },
        ExpressionAttributeValues: {
            ":company_id": parseInt(company_id)
        }
    };

    docClient.query(params, (err, data) => {
        if (err) {
            console.log('err = ', err)
            return res.send('Internal server error');
        }
        console.log(JSON.stringify(data.Items))
        return res.render('company', { data: data.Items[0] });
    })
});

app.post('/', convertFromJson.fields([]), (request, respone) => {
    //lấy data được người dùng gửi lên
    const { ma_company, ten_company, hinhanh_company } = request.body;
    // chỉnh sửa data trên database
    const params = {
        TableName: tableName,
        Item: {
            ma_company: Number(ma_company),
            ten_company,
            hinhanh_company,
            sanpham: null
        }
    };

    docClient.put(params, (err, data) => {
        if (err) {
            console.log(err);
            return respone.send("Internal server error");
        }
        //chuyển về trang chủ ban đầu
        return respone.redirect('/');
    });
});

app.post('/delete', convertFromJson.fields([]), (request, respone) => {
    //lấy data được người dùng gửi lên
    const { ma_company } = request.body;
    console.log(ma_company);
    // chỉnh sửa data trên database
    const params = {
        TableName: tableName,
        Key: {
            ma_company: Number(ma_company)
        }
    };

    docClient.delete(params, (err, data) => {
        if (err) {
            console.log(err);
            return respone.send("Internal server error");
        }
        //chuyển về trang chủ ban đầu
        return respone.redirect('/');
    });
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});