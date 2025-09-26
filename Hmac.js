
const crypto = require('crypto');

const Hmac = {
	
	create : function(data,key,algo='sha256')
	{

		if( !crypto.getHashes().includes(algo) )
			return false;

		data = Hmac._strValAndSort(data);
		
		return crypto.createHmac(algo, key)
			.update( JSON.stringify(data).replaceAll("/", "\\/") )
			.digest('hex')
	},


	verify : function(data,key,sign,algo='sha256')
	{
		_sign = Hmac.create(data,key,algo);
		return ( _sign && _sign.toLowerCase() == sign.toLowerCase() );
	},

	_strValAndSort : function (data) {

		data = Hmac._sortObject(data);

        for (var item in data)
			if (data.hasOwnProperty(item))
                if (typeof data[item] === "object")
                    data[item] = Hmac._strValAndSort(data[item]);
                else
                    data[item] = data[item].toString();
		
		return data;
    },

	_sortObject : function (obj) {

		if( Array.isArray(obj) )
			return obj;

		return Object.keys(obj).sort().reduce(function (result, key) {
			result[key] = obj[key];
			return result;
		}, {});

	}
	
};

module.exports = Hmac