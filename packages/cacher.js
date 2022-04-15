class Cacher {
	#data = {}
	#path

	constructor(filename) {
		this.#path = "./data/cached/" + filename
		this.#data = JSON.parse(fs.readFileSync(this.#path, "utf8"))
	}

	getElement(key) {
		return this.#data[key]
	}

	setElement(key, value) {
		this.#data[key] = value
		fs.writeFileSync(this.#file, JSON.stringify(this.#data, null, 4))
	}
}

exports.Cacher = Cacher