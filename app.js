// Tech
const rp = require("request-promise");
const config = require("./.config");
const chalk = require("chalk");
const log = console.log;

// API
const apiKey = config.apiKey;
const mainHost = "https://api.yelp.com/v3";
// const mainHost = "http://127.0.0.1:8080";
const resturantsLocationRadius = "/businesses/search";

// APP
// Default location
const userLocations = process.argv.slice(2)[0] ?
	process.argv.slice(2)[0].split("&&").map((_) => {
		return _.trim();
	}):"4 rue de la Pierre Levée, 75011 Paris";
// Default radius is 1000
const radius = process.argv.slice(2)[1] ? process.argv.slice(2)[1]:1000;

/*
	1 - Config
	2 - Fetch businesses @ location + radius for each provided locations
*/
(async () => {
	console.log("#############");
	printOK("Configuration: "+radius+"m around "+ userLocations.join(" and "));
	console.log("#############\n\n");
	displayBusinesses(
		await fetchBusinessesForEachLocations(userLocations, radius)
	);
})().catch((e) => printNOK(e.stack));

/**
 * @description Fetch businesses next to specified user locations
 * @author eskh
 * @date 2019-09-08
 * @param {Array} usersLocations The array of the users locations to find the restaurant near from
 * @param {int} radius The radius allowed for restaurant to be in, around a user location
 * @return {Array} Businesses close to users' locations
 */
async function fetchBusinessesForEachLocations(usersLocations, radius) {
	const usersResults = [];
	for (userLocation of usersLocations) {
		const userResult = {};
		userResult.location = {};
		userResult.location.address = userLocation;
		userResult.location.radius = radius;
		userResult.location.businesses = await fetchBusinesses(userLocation, radius);
		usersResults.push(userResult);
	}
	return usersResults;
}
/**
 * @description Fetch businesses @ [radius]m around a given location
 * @author eskh
 * @date 2019-09-08
 * @param {String} location Location to spot the businesses in
 * @param {int} radius Radius around that location
 * @return {Array} Businesses around [radius]m from location
 */
async function fetchBusinesses(location, radius) {
	const formattedDesiredLocation = resturantsLocationRadius+"?location="+location+"&"+"radius="+radius;
	const foundRestaurants = await fetch(formattedDesiredLocation);
	return foundRestaurants.businesses;
}

/**
 * @description Fetch and display a colored-formatted list of businesses per user location
 * @author eskh
 * @date 2019-09-08
 * @param {Array} usersAndBusinesses An array containing, for each user location, a list of businesses
 */
function displayBusinesses(usersAndBusinesses) {
	for (const aUser of usersAndBusinesses) {
		log("Restaurants @ "+aUser.location.address+":");
		for (const aBusiness of aUser.location.businesses) {
			console.log("|\t"+aBusiness.name+ " @"+howFar(aBusiness)+" for "+howExpensive(aBusiness));
		}
		log("--------------------------");
	}
}
/**
 * @description Fetch a response from an endpoint, behind Authorization Bearer
 * @author eskh
 * @date 2019-09-08
 * @param {String} endpoint The endpoint to fetch the response from
 * @return {Promise} The promise containing the response
 */
async function fetch(endpoint) {
	const urlToFetch = mainHost+endpoint;
	const options = {
		uri: urlToFetch,
		headers: {"Authorization": "Bearer "+apiKey},
		json: true,
	};
	return await rp(options);
}
/**
 * @description Returns a formatted price indicator
 * @author eskh
 * @date 2019-09-08
 * @param {Object} aBusiness The business to return the price indicator for
 * @return {String} A formatted price indicator
 */
function howExpensive(aBusiness) {
	if (aBusiness.price =="€€€") {
		return chalk.red(aBusiness.price);
	} else if (aBusiness.price =="€€") {
		return chalk.yellow(aBusiness.price);
	} else if (aBusiness.price =="€") {
		return chalk.green(aBusiness.price);
	} else return chalk.yellow("?");
}
/**
 * @description Returns a formatted proximity indicator, given a radius
 * @author eskh
 * @date 2019-09-08
 * @param {Object} aBusiness The business to return the proximity indicator for
 * @param {int} radius Radius around that location
 * @return {String} A formatted proximity indicator
 */
function howFar(aBusiness, radius) {
	if (aBusiness.distance>radius-200) {
		return chalk.red(aBusiness.distance+"m");
	} else if (aBusiness.distance>radius/2) {
		return chalk.yellow(aBusiness.distance+"m");
	} else {
		return chalk.green(aBusiness.distance+"m");
	}
}
function printOK(text) {
	log(chalk.green(text));
}
function printNOK(text) {
	log(chalk.red(text));
}
