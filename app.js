var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'web')));


var System = require('cassandra-client').System;

/** gets keyspace information */
System.prototype.describeKeyspaces = function(callback) {
    this.q.put(function(con) {
        con.thriftCli.describe_keyspaces(callback);
    });
    this.emit('checkq');
};

app.get('/api/:ks/:cf', function(req, res) {
    var PooledConnection = require('cassandra-client').PooledConnection;
    var hosts = ['172.17.25.181:9160'];
    var ks = req.params.ks;
    console.log('ks:'+ks);
    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': ks});

//    var str = "58:93:96:2B:D8:E0";
//    var bytes = "";
//
//    for (var i = 0; i < str.length; ++i)
//    {
//        bytes += str.charCodeAt(i).toString(16);
//    }
//
//    var str2 = "timezone";
//
//    var bytes2 = "";
//    for (var i = 0; i < str2.length; ++i)
//    {
//        bytes2 += str2.charCodeAt(i).toString(16);
//    }

// Reading
    var cf = req.params.cf;
    console.log('cf:'+cf);
    connection_pool.execute('SELECT * FROM ?', [cf],
        function(err, rows) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < rows.length; i++) {
                    console.log(rows[i]);
                    for (var key in rows[i].colHash) {
                        var value = rows[i].colHash[key];
                        rows[i].colHash[key] = value instanceof Buffer? value.toString(): value;
                        value = rows[i].colHash[key];
                        try {
                            if (value != '{}') {
                                rows[i].colHash[key] = JSON.parse(value);
                                if (typeof rows[i].colHash[key] === 'object') {
                                    var arr = _.pairs(rows[i].colHash[key]).sort();
                                    var newObj = {};
                                    arr.forEach(function (kv) {
                                        newObj[kv[0]]=kv[1];
                                    });
                                    rows[i].colHash[key] = newObj;}
//                                rows[i].colHash[key].sort();
                            }
                        }
                        catch (e) {

                            rows[i].colHash[key] = value;
                        }
                    }
                    rows[i].key = rows[i].key.toString();
                    delete rows[i].cols;
                }
            }
            res.end(JSON.stringify(rows));
            connection_pool.shutdown(function() { console.log("connection pool shutdown"); });
        }
    );

//    var requestUrl = req.body.requestUrl;
//    var requestContent = req.body.requestContent;

// Creating a new connection pool.
//    var PooledConnection = require('cassandra-client').PooledConnection;
//    var hosts = ['172.17.25.181:9160'];
//    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': 'wsg'});
//
//    var str = "58:93:96:2B:D8:E0";
//    var bytes = "";
//
//    for (var i = 0; i < str.length; ++i)
//    {
//        bytes += str.charCodeAt(i).toString(16);
//    }
//
//    var str2 = "timezone";
//
//    var bytes2 = "";
//    for (var i = 0; i < str2.length; ++i)
//    {
//        bytes2 += str2.charCodeAt(i).toString(16);
//    }
//
//// Reading
//    connection_pool.execute('SELECT * FROM ap WHERE KEY=?', [bytes],
//        function(err, row) {
//            var obj = {};
//            if (err) {
//                console.log(err);
//            } else {
////            console.log(row[0].cols);
//                row[0].cols.forEach(function (entry) {
//                    obj[entry.name] = entry.value instanceof Buffer && entry.value.toString() || entry.value;
//                });
//            }
////            console.log(row[0].cols[0].name.toString());
////            console.log(row[0].cols[0].value.toString());
//
////        else console.log("got result " + row.cols[0].value);
//// Shutting down a pool
//            connection_pool.shutdown(function() { console.log("connection pool shutdown"); });
//            console.log(obj);
////        console.log(JSON.parse(obj.lanPortStatus.toString()));
////        console.log(obj.lanPortStatus instanceof Buffer)
//        }
//    );



});


app.get('/api/ks', function(req, res) {
    var sys = new System('172.17.25.181:9160');

    sys.describeKeyspaces(function(err, ksDefs) {
        if (err) {
            console.log(err);
        } else {
            res.end(JSON.stringify(ksDefs));
        }
        sys.close();
    });
});


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.send(500, 'Something broken!\n' + err.stack);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.send(500, 'Something broken!\n' + err.message);
});


module.exports = app;
