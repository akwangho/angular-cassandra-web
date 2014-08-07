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
    var hosts = [];
    console.log(req.query.ip);
    hosts.push(req.query.ip);
    var ks = req.params.ks;
    var connection_pool = new PooledConnection({'hosts': hosts, 'keyspace': ks});

// Reading
    var cf = req.params.cf;
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
});


app.get('/api/ks', function(req, res) {
    console.log(req.query.ip);
    var sys = new System(req.query.ip);

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
