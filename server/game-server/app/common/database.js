const mongoClient = require('mongodb').MongoClient;

class Database
{
    constructor(url, dbname, opts)
    {
        this.m_mongoConf = { url:url, dbName:dbname, dbOptions: opts };
        this.connectdb = null;
    }

    _connection(callback)
    {
        if (this.connectdb == null){
        mongoClient.connect(this.m_mongoConf.url, this.m_mongoConf.dbOptions, (err, db) => {
            if (err) console.error(err);
            this.connectdb = db
            callback(db);
        });
        }else {
            callback(this.connectdb);
        }
    }

    insertOne(tblname, data, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).insertOne(data, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("insertOne: " + e);
            //}
        });
    }

    insertMany(tblname, datas, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).insertMany(datas, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("insertMany: " + e);
            //}
        });
    }

    deleteOne(tblname, where, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).deleteOne(where, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("deleteOne: " + e);
            //}
        });
    }

    deleteMany(tblname, where, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).deleteMany(where, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("deleteMany: " + e);
            //}
        });
    }

    findOne(tblname, query, where, callback, requery=false)
    {
        this._connection((db) => {
            var val = 1;
            var opts = { projection: { _id: 0 } };
            if (requery) val = 0;
            for (let i = 0; i < query.length; i++)
                opts.projection[query[i]] = val;

            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).findOne(where, opts, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("findOne: " + e);
            //}
        });
    }

    findMany(tblname, query, where, callback, pattern = { requery:false })
    {
        this._connection((db) => {
            var val = 1;
            var opts = pattern;
            opts.projection = { _id: 0 };
            if (pattern.requery) val = 0;
            for (let i = 0; i < query.length; i++)
                opts.projection[query[i]] = val;

            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).find(where, opts).toArray((err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("findMany: " + e);
            //}
        });
    }

    findAndModify(tblname, query, where, set, callback, pattern={requery:false})
    {
        this._connection((db) => {
            var val = 1;
            var opts = pattern;
            opts.projection = { _id: 0 };
            if (pattern.requery) val = 0;
            for (let i = 0; i < query.length; i++)
                opts.projection[query[i]] = val;

            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).findOneAndUpdate(where, set, opts, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res.value);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("findAndModify: " + e);
            //}
        });
    }

    updateOne(tblname, set, where, callback, pattern={})
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).updateOne(where, set, pattern, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("updateOne: " + e);
            //}
        });
    }

    updateMany(tblname, set, where, callback, pattern={})
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).updateMany(where, set, pattern, (err, res) => {
                    if (err) console.error(err);
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("updateMany: " + e);
            //}
        });
    }

    aggregate(tblname, query, where, lookups, callback)
    {
        this._connection((db) => {
            //try {
                var param = [];
                param.push({$match:where});
                query._id = 0;
                param.push({$project:query});
                for (let i = 0; i < lookups.length; i++)
                    param.push(lookups[i]);

                db.db(this.m_mongoConf.dbName).collection(tblname).aggregate(param, { cursor: { batchSize: 100 } }, function (err, cursor) {
                    if (err) throw err;
                    cursor.get((err, res) => {
                        if (err) console.error(err);
                        //db.close();
                        callback(res);
                    });
                });
            //} catch (e) {
            //    db.close();
            //    console.error("aggregate: " + e);
            //}
        });
    }

    dropTable(tblname, callback)
    {
        this._connection((db) => {
           //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).drop((err, res) => {
                    //if (err) throw err;
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("dropTable: " + e);
            //}
        });
    }

    clean(tblname, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).remove((err, res) => {
                    //if (err) throw err;
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("dropTable: " + e);
            //}
        });
    }

    count(tblname, where, callback)
    {
        this._connection((db) => {
            //try {
                db.db(this.m_mongoConf.dbName).collection(tblname).find(where).count((err, res) => {
                    if (err) throw err;
                    //db.close();
                    callback(res);
                });
            //} catch (e) {
            //    db.close();
            //    console.error("count: " + e);
            //}
        });
    }
}

module.exports = Database;
