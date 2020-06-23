const mongoClient = require('mongodb').MongoClient;

class mongoHelper
{
	constructor(mongoConfig)
	{
		this.mongoCfg = mongoConfig; // { url, options, dbname }
	}

	connectDB(callback)
	{
		mongoClient.connect(this.mongoCfg.url, this.mongoCfg.options, (err, db) => {
			if (err) { console.error(err); }
			callback(db);
		});
	}

	insertOne(db, tblname, data, callback)
	{
		db.db(this.mongoCfg.dbname).collection(tblname).insertOne(data, (err, res) => {
			if (err) { console.error(err); }
			callback(res);
		});
	}

	insertMany(db, tblname, datas, callback)
	{
		db.db(this.mongoCfg.dbname).collection(tblname).insertMany(datas, (err, res) => {
			if (err) { console.error(err); }
			callback(res);
		});
	}

	findOne(db, tblname, query, where, callback, requery=false)
	{
		var val = 1, opts = { projection: { _id: 0 } };
        if (requery) val = 0;
        for (let i = 0; i < query.length; i++)
            opts.projection[query[i]] = val;

       	db.db(this.mongoCfg.dbname).collection(tblname).findOne(where, opts, (err, res) => {
       		if (err) { console.error(err); }
			callback(res);
       	});
	}

	findMany(db, tblname, query, where, callback, pattern={ requery: false })
	{
		var val = 1, opts = pattern;
        opts.projection = { _id: 0 };
        if (pattern.requery) val = 0;
        for (let i = 0; i < query.length; i++)
            opts.projection[query[i]] = val;
       	db.db(this.mongoCfg.dbname).collection(tblname).find(where, opts).toArray((err, res) => {
       		if (err) { console.error(err); }
			callback(res);
       	});
	}

	findAndModify(db, tblname, query, where, set, callback, pattern={ requery:false })
	{
		var val = 1, opts = pattern;
		opts.projection = { _id: 0 };
		if (pattern.requery) val = 0;
		for (let i = 0; i < query.length; i++)
			opts.projection[query[i]] = val;

		db.db(this.mongoCfg.dbname).collection(tblname).findOneAndUpdate(where, set, opts, (err, res) => {
			if (err) { console.error(err); }
			callback(res.value);
		});
	}

	updateOne(db, tblname, set, where, callback, pattern={})
	{
		db.db(this.mongoCfg.dbname).collection(tblname).updateOne(where, set, pattern, (err, res) => {
			if (err) { console.error(err); }
			callback(res);
		});
	}

	updateMany(db, tblname, set, where, callback, pattern={})
	{
		db.db(this.mongoCfg.dbname).collection(tblname).updateMany(where, set, pattern, (err, res) => {
			if (err) { console.error(err); }
			callback(res);
		});
	}

	createIndex(db, tblname, keys, callback, options)
	{
		db.db(this.mongoCfg.dbname).collection(tblname).createIndex(keys, options, (err, res) => {
			if (err) { console.error(err); }
			callback(res);
		});
	}
}

module.exports = mongoHelper;