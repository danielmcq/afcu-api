"use strict"

const jsdom   = require("jsdom"),
      request = require("request")

const config = require("./config.json")

const cookies = jsdom.createCookieJar()
const vConsole = jsdom.createVirtualConsole()

vConsole.on("log",   msg=>console.log(   "console.log called ->",   msg))
vConsole.on("warn",  msg=>console.warn(  "console.warn called ->",  msg))
vConsole.on("info",  msg=>console.info(  "console.info called ->",  msg))
vConsole.on("error", msg=>console.error( "console.error called ->", msg))


request({uri: config.entryUri}, (err, res, body)=>{
	if (err) return console.error(err)

	jsdom.env({
		html: body,
		scripts: [
			"https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"
		],
		cookieJar: cookies,
		virtualConsole: vConsole,
		done: (err, window)=>{
			const $ = window.jQuery
			console.log("we got res")
			// console.log($('body').html())

			console.log("cookies!\n\n")
			console.log(cookies)

			loginPageAccountNumber($)
		}
	})
})

function loginPageAccountNumber ($) {
	$("#txtUserID").val( Buffer.from(config.credentials.username, "base64") )
	$("#btnLogin").click()
}