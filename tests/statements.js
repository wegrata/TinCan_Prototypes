/* Global equal, responseText, statement, ok, deepEqual, QUnit, module, asyncTest, Util, start */
/*jslint devel: true, browser: true, sloppy: false, maxerr: 50, indent: 4 */
var statementsEnv = {};

module('Statements', {
	setup: function () {
		"use strict";
		Util.init(statementsEnv);
	}
});


asyncTest('empty statement PUT', function () {
	// empty statement should fail w/o crashing the LRS (error response shoudl be received)
	"use strict";
	statementsEnv.util.request('PUT', '/Statements/' + statementsEnv.id, null, true, 400, 'Bad Request', start);
});

asyncTest('empty statement POST', function () {
	// empty statement should fail w/o crashing the LRS (error response shoudl be received)
	"use strict";
	statementsEnv.util.request('POST', '/Statements/', null, true, 400, 'Bad Request', start);
});

asyncTest('PUT / GET', function () {
	"use strict";
	var env = statementsEnv,
		url = '/Statements/' + env.id;

	env.util.request('PUT', url, JSON.stringify(env.statement), true, 204, 'No Content', function () {
		env.util.request('GET', url, null, true, 200, 'OK', function (xhr) {
			env.util.validateStatement(xhr.responseText, env.statement, env.id);
			start();
		});
	});
});

asyncTest('POST /w ID', function () {
	"use strict";
	var env = statementsEnv,
		url = '/Statements/' + env.id;

	env.util.request('POST', url, JSON.stringify(env.util.golfStatements), true, 405, 'Method Not Allowed', function () {
		start();
	});
});


asyncTest('Authentication', function () {
	"use strict";
	var env = statementsEnv,
		url = '/Statements/' + env.id,
		util = env.util;


	util.request('PUT', url, JSON.stringify(env.statement), false, 401, 'Unauthorized', function () {
		util.request('GET', url, null, false, 401, 'Unauthorized', function () {
			start();
		});
	});
});

asyncTest('Reject Modification', function () {
	"use strict";

	var env = statementsEnv,
		util = env.util,
		id = util.ruuid(),
		url = '/Statements/' + id;

	util.request('PUT', url, JSON.stringify(env.statement), true, 204, 'No Content', function () {
		util.request('PUT', url, JSON.stringify(env.statement).replace('experienced', 'passed'), true, 409, 'Conflict', function () {
			util.request('GET', url, null, true, 200, 'OK', function (xhr) {
				util.validateStatement(xhr.responseText, env.statement, id);
				start();
			});
		});
	});
});

asyncTest('Reject Actor Modification', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		otherId = util.ruuid(),
		url = '/Statements/',
		modLearnerName = 'Renamed Auto Test Learner';

	util.request('PUT', url + util.ruuid(), JSON.stringify(env.statement), true, null, null, function () {
		util.request('PUT', url + otherId, JSON.stringify(env.statement).replace(env.statement.actor.name, modLearnerName), true, 204, 'No Content', function () {
			util.request('GET', url + otherId, null, true, 200, 'OK', function (xhr) {
				var response;
				response = util.tryJSONParse(xhr.responseText);

				// verify statement is returned with modified name, but then undo modification for checking the rest of the statement
				equal(response.actor.name, modLearnerName);
				response.actor.name = env.statement.actor.name;
				util.validateStatement(JSON.stringify(response), env.statement, otherId);

				util.request('GET', '/actors/<actor>/', null, true, 200, 'OK', function (xhr) {
					equal(util.tryJSONParse(xhr.responseText).name, env.statement.actor.name, 'Actor should not have been renamed based on statement.');
					start();
				});
			});
		});
	});
});

asyncTest('Bad Verb', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/' + util.ruuid(),
		statement = util.clone(env.statement);

	statement.verb = 'not a valid verb';
	util.request('PUT', url, JSON.stringify(statement), true, 400, 'Bad Request', function (xhr) {
		// should return an error message, can't validatate content, but make sure it's there
		ok(xhr.responseText !== null && xhr.responseText.length > 0, "Message returned");
		util.request('GET', url, null, true, 404, 'Not Found', function () {
			start();
		});
	});
});

asyncTest('Bad ID', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/' + util.ruuid() + 'bad_id',
		statement = util.clone(env.statement);

	util.request('PUT', url, JSON.stringify(statement), true, 400, 'Bad Request', function (xhr) {
		// should return an error message, can't validatate content, but make sure it's there
		ok(xhr.responseText !== null && xhr.responseText.length > 0, "Message returned");
		util.request('GET', url, null, true, 400, 'Bad Request', function () {
			start();
		});
	});
});

asyncTest('pass special handling', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/' + util.ruuid(),
		statement = util.clone(env.statement);

	statement.verb = 'passed';

	util.request('PUT', url, JSON.stringify(statement), true, 204, 'No Content', function () {
		util.request('GET', url, null, true, 200, 'OK', function (xhr) {
			var response = JSON.parse(xhr.responseText);
			equal(response.verb, 'passed', 'verb');
			equal(response.result.success, true, 'success');
			equal(response.result.completion, true, 'completion');
			start();
		});
	});
});

asyncTest('fail special handling', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/' + util.ruuid(),
		statement = util.clone(env.statement);

	statement.verb = 'failed';

	util.request('PUT', url, JSON.stringify(statement), true, 204, 'No Content', function () {
		util.request('GET', url, null, true, 200, 'OK', function (xhr) {
			var response = JSON.parse(xhr.responseText);
			equal(response.verb, 'failed', 'verb');
			equal(response.result.success, false, 'success');
			equal(response.result.completion, true, 'completion');
			start();
		});
	});
});

asyncTest('completed special handling', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/' + util.ruuid(),
		statement = util.clone(env.statement);

	statement.verb = 'completed';

	util.request('PUT', url, JSON.stringify(statement), true, 204, 'No Content', function () {
		util.request('GET', url, null, true, 200, 'OK', function (xhr) {
			var response = JSON.parse(xhr.responseText);
			equal(response.verb, 'completed', 'verb');
			equal(response.result.completion, true, 'completion');
			start();
		});
	});
});

asyncTest('POST multiple', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/',
		golfStatements = util.golfStatements;

	util.request('POST', url, JSON.stringify(golfStatements), true, 200, 'OK', function (xhr) {
		var ids = JSON.parse(xhr.responseText),
			object,
			ii,
			testId = ids[5]; // first few statements aren't good examples, grab the 5th one

		for (ii = 0; ii < golfStatements.length; ii++) {
			if (golfStatements[ii].id === testId) {
				object = encodeURIComponent(JSON.stringify(golfStatements[ii].object, null, 4));

				env.util.request('GET', url + '?limit=5&sparse=false&object=' + object, null, true, 200, 'OK', function (xhr) {
					var results = util.tryJSONParse(xhr.responseText),
						jj;
					for (jj = 0; jj < results.length; jj++) {
						if (results[jj].id === golfStatements[ii].id) {
							delete results[jj].object.definition;
							env.util.validateStatement(results[jj], golfStatements[ii], testId);
							start();
							return;
						}
					}

					ok(false, 'Returned statement ID "' + testId + '" not found.');
					start();
				});
				return;
			}
		}
		ok(false, 'Returned statement ID "' + testId + '" not found.');
		start();
		return;
	});
});

asyncTest('GET statements', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/';


	util.request('GET', url + '?limit=1', null, true, 200, 'OK', function (xhr) {
		var result = util.tryJSONParse(xhr.responseText);
		console.log(JSON.stringify(result, null, 4));
		equal(result.length, 1, 'GET limit 1');
		ok(result[0].verb !== undefined, 'statement has verb (is a statement)');
		start();
	});
});

asyncTest('GET statements (via POST)', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/';


	util.request('POST', url, 'limit=1', true, 200, 'OK', function (xhr) {
		var result = util.tryJSONParse(xhr.responseText);
		console.log(JSON.stringify(result, null, 4));
		equal(result.length, 1, 'GET limit 1');
		ok(result[0].verb !== undefined, 'statement has verb (is a statement)');
		start();
	});
});


asyncTest('GET statements (via POST), all filters', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/';


	util.request('POST', url, 'limit=10', true, 200, 'OK', function (xhr) {
		var statements = util.tryJSONParse(xhr.responseText),
			statement,
			filters = {},
			prop,
			queryString = [];

		if (statements.length === 10) {
			// pick a statement with statements stored before & after
			statement = statements[5];

			// add filters which match the selected statement
			filters.since = (new Date(new Date(statement.stored).getTime() - 1)).toString();
			filters.until = statement.stored;
			filters.verb = statement.verb;
			filters.object = JSON.stringify(statement.object, null, 4);
			if (statement.registration !== undefined) {
				filters.registration = statement.registraiton;
			}
			filters.actor = JSON.stringify(statement.actor, null, 4);

			for (prop in filters) {
				if (filters.hasOwnProperty(prop)) {
					queryString.push(prop + '=' + encodeURIComponent(filters[prop]));
				}
			}

			util.request('POST', url, queryString.join('&'), true, 200, 'OK', function (xhr) {
				var results = util.tryJSONParse(xhr.responseText),
					ii,
					found = false;

				for (ii = 0; ii < results.length; ii++) {
					if (results[ii].id === statement.id) {
						found = true;
					}
					equal(results[ii].stored, statement.stored, 'stored');
					equal(results[ii].verb, statement.verb, 'verb');
					if (statement.object.id !== undefined) {
						// object is an activity
						equal(results[ii].object.id, statement.object.id, 'object');
					} else {
						// object is an actor
						ok(util.areActorsEqual(results[ii].object, statement.object), 'object');
					}
					if (statement.registration !== undefined) {
						equal(results[ii].registration, statement.registration, 'registration');
					}
					// actor comparison
					ok(util.areActorsEqual(results[ii].actor, statement.actor), 'actor');
				}
				ok(found, 'find statement filters based on');
				start();
			});
		} else {
			ok(false, 'Test requires at least 10 existing statements');
			start();
		}
	});
});

function getGolfStatement(id) {
	"use strict";
	var ii, util = statementsEnv.util;

	for (ii = 0; ii < util.golfStatements.length; ii++) {
		if (util.golfStatements[ii].object.id === id) {
			return util.golfStatements[ii];
		}
	}
	return null;
}

function verifyGolfDescendants(callback) {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/',
		testActivity = { id : 'scorm.com/GolfExample_TCAPI' };

	util.request('GET', url + '?verb=imported&limit=1&object=' + encodeURIComponent(JSON.stringify(testActivity)), null, true, null, null, function (xhr) {
		if (xhr.status !== 200) {
			util.request('POST', url, JSON.stringify(getGolfStatement(testActivity.id), null, 4), true, 200, 'OK', function () {
				callback();
			});
		}
	});
}

asyncTest('Statements, descendants filter', function () {
	"use strict";
	var env = statementsEnv,
		util = env.util,
		url = '/Statements/',
		statement,
		testActivity = { id: 'com.scorm.golfsamples.interactions.playing_1'},
		ancestorId = 'scorm.com/GolfExample_TCAPI',
		ancestorFilter = encodeURIComponent(JSON.stringify({id : ancestorId}));

	// add statement to find
	statement = util.clone(getGolfStatement(testActivity.id));
	statement.id = util.ruuid();
	statement.registration = statement.id;

	//?limit=1&activity=' + encodeURIComponent(JSON.stringify(testActivity))
	// statement not found by ancestor w/o using 'descendant' flag
	util.request('PUT', url + statement.id, JSON.stringify(statement, null, 4), true, 204, 'No Content', function () {
		util.request('GET', url + '?registration=' + statement.registration + '&object=' + ancestorFilter, null, true, 200, 'OK', function (xhr) {
			equal(JSON.parse(xhr.responseText).length, 0, 'response, find by ancestor no descendants flag');
			util.request('GET', url + '?registration=' + statement.registration + '&descendants=true&object=' + ancestorFilter, null, true, 200, 'OK', function (xhr) {
				var resultStatements = util.tryJSONParse(xhr.responseText),
					resultStatement = resultStatements[0];
				if (resultStatement === undefined) {
					ok(false, 'statement not found using descendant filter');
				} else {
					equal(resultStatement.id, statement.id, 'correct statement found using descendant filter');
				}
				start();
			});
		});
	});

	/*util.request('POST', url, 'limit=10', true, 200, 'OK', function (xhr) {
		var statements = util.tryJSONParse(xhr.responseText),
			statement,
			filters = {},
			prop,
			queryString = [];

		if (statements.length === 10) {
			// pick a statement with statements stored before & after
			statement = statements[5];

			// add filters which match the selected statement
			filters.since = (new Date(new Date(statement.stored).getTime() - 1)).toString();
			filters.until = statement.stored;
			filters.verb = statement.verb;
			filters.object = JSON.stringify(statement.object, null, 4);
			if (statement.registration !== undefined) {
				filters.registration = statement.registraiton;
			}
			filters.actor = JSON.stringify(statement.actor, null, 4);

			for (prop in filters) {
				if (filters.hasOwnProperty(prop)) {
					queryString.push(prop + '=' + encodeURIComponent(filters[prop]));
				}
			}

			util.request('GET', url + statement.id, null, true, 200, 'OK', function (xhr) {
				var results = util.tryJSONParse(xhr.responseText),
					ii,
					found = false;

				results = [results];

				for (ii = 0; ii < results.length; ii++) {
					if (results[ii].id === statement.id) {
						found = true;
					}
					equal(results[ii].stored, statement.stored, 'stored');
					equal(results[ii].verb, statement.verb, 'verb');
					if (statement.object.id !== undefined) {
						// object is an activity
						equal(results[ii].object.id, statement.object.id, 'object');
					} else {
						// object is an actor
						ok(util.areActorsEqual(results[ii].object, statement.object), 'object');
					}
					if (statement.registration !== undefined) {
						equal(results[ii].registration, statement.registration, 'registration');
					}
					// actor comparison
					ok(util.areActorsEqual(results[ii].actor, statement.actor), 'actor');
				}
				ok(found, 'find statement filters based on');
				start();
			});
		} else {
			ok(false, 'Test requires at least 10 existing statements');
			start();
		}
	});*/
});