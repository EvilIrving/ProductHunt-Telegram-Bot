let env;

export function setEnv(envVar) {
	env = envVar;
}

export function getEnv() {
	if (!env) {
		throw new Error('Environment variable not set');
	}
	return env;
}

