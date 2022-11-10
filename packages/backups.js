const fs = require("fs");
const {exec} = require("child_process")

exports.SaveBackup = async function() {
	console.log("Saving backup...")
	let path = "backups/" + new Date().toLocaleDateString().replaceAll("/", "-")
	exec(`rm -rf ${path} && cp data -r backups && mv backups/data ${path}`, (error, _, stderr) => {
		if (error)
			return void console.log(stderr)
		console.log("Backup completed!")
		const backups = fs.readdirSync("backups").length
		if (backups > 10)
			exec("cd backups && rm -r \"$(ls -t | tail -1)\"")
	})
}