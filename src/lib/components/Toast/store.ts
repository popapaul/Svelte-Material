import type { ComponentProps } from 'svelte';
import { writable } from 'svelte/store';
import { Snackbar } from '../Snackbar';

/**
 * Default Toast Options
 * {
 *   duration: 5000,       // duration of progress bar tween to the `next` value
 *   initial: 1,           // initial progress bar value
 *   progress: 0,          // progress value
 *   pausable: true,      // pause progress bar tween on mouse hover
 *   dismissable: true,    // allow dismiss with close button
 *   intro: { x: 256 },    // toast intro fly animation settings
 * }
 */

export type Toast = {
	id?: number;
	initial?: number;
	progress?: number;
	pausable?: boolean;
	dismissable?: boolean;
	message?: string;
} & ComponentProps<typeof Snackbar>

const defaults: Toast = {
	duration: 5000,
	initial: 1,
	progress: 0,
	pausable: true,
	dismissable: true,
	type: 'info'
};

const createToast = () => {
	const { subscribe, update } = writable<Toast[]>([]);
	let count = 0;

	const add = (
		message: string,
		type?: 'success' | 'warning' | 'info' | 'error',
		opts: Toast = defaults
	) => {
		const entry = {
			...defaults,
			...opts,
			message,
			reversed: false,
			type,
			id: ++count
		};
		update((n) => [...n, entry]);
		return count;
	};
	const pop = (id: number) => {
		update((n) => {
			if (!n.length || id === 0) return [];
			if (id) return n.filter((i) => i.id !== id);
			const target = id || Math.max(...n.map((i) => i.id));
			return n.filter((i) => i.id !== target);
		});
	};
	const set = (id: number, opts: Toast = defaults) => {
		const param = { ...opts, id };
		update((n) => {
			const idx = n.findIndex((i) => i.id === param.id);
			if (idx > -1) {
				n[idx] = { ...n[idx], ...param };
			}
			return n;
		});
	};
	return { subscribe, add, pop, set };
};

export default createToast();
