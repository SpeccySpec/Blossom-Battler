const fs = require("fs");
const {exec} = require("child_process")

exports.SaveBackup = async function() {
	console.log("Saving backup...")
	let path = "backups/" + new Date().toLocaleDateString().replaceAll("/", "-") + ".zip"
	exec(`rm -rf ${path} && zip ${path} data`, (error, _, stderr) => {
		if (error)
			return void console.log(stderr)
		console.log("Backup completed!")
		const backups = fs.readdirSync("backups").length

		if (backups > 10) exec("cd backups && rm -r \"$(ls -t | tail -1)\"")

		// Update backups automatically.
/*		setTimeout(() => {
			exec('git add backups', (error, stdout, stderr) => {
				if (error) return void console.log(stderr);
				exec('git commit -m "Update backups (AUTOMATED BY BB)"', (error, stdout, stderr) => {
					if (error) return void console.log(stderr);
					exec("git push");
				})
			})
		}, 10000)*/
	})
}