const kafka = require('kafka-node');
const kafkaConf = require('../../configs/log.json').kafkaConf;

const KafkaProducer = {};

const client = new kafka.KafkaClient({kafkaHost: kafkaConf.kafkaHost});
const producer = new kafka.Producer(client,{ requireAcks: 1 });

const logger = require('./logger/index')

producer.on('ready', () => {
	logger.info('kafka connect success ')
	console.info('kafka 连接成功');
});

producer.on('error', function (error) {
	logger.error('kafka connect error ')
	console.info('kafka 连接失败...')
})

console.info(' kafka 连接中...');

KafkaProducer.produce = async (message,key) => {
	return new Promise((resolve,reject) => {
		let suffix = '';
		suffix += kafkaConf.fork ? [Date.now() %2 === 0 ? 0 : 1] : '';
		const payloads = [
			{topic: kafkaConf.topic + suffix,attributes: 1, messages: message,key:key}
		];

		producer.send(payloads, (err, data) => {
			if (!!err) {
				reject(err)
				logger.error('producer error:', err);
			}
			resolve(data);
		});
	})
};

module.exports = KafkaProducer;