/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		// domain → 外部層 禁止（domain は最内層。外部依存を持たない）
		{
			name: 'domain-no-depend-on-outer-layers',
			severity: 'error',
			comment: 'domain 層は application, infrastructure, presentation に依存してはならない',
			from: { path: 'src/backend/domain/' },
			to: {
				path: [
					'src/backend/application/',
					'src/backend/infrastructure/',
					'src/backend/presentation/',
				],
			},
		},
		// application → infrastructure 禁止（Gateway interface 経由のみ）
		{
			name: 'application-no-depend-on-infrastructure',
			severity: 'error',
			comment:
				'application 層は infrastructure に直接依存してはならない（domain の Gateway interface 経由のみ）',
			from: { path: 'src/backend/application/' },
			to: { path: 'src/backend/infrastructure/' },
		},
		// application → presentation 禁止
		{
			name: 'application-no-depend-on-presentation',
			severity: 'error',
			comment: 'application 層は presentation に依存してはならない',
			from: { path: 'src/backend/application/' },
			to: { path: 'src/backend/presentation/' },
		},
		// frontend → backend/presentation 以外禁止（composition 経由でのみ検知機能を利用）
		{
			name: 'frontend-only-depend-on-presentation',
			severity: 'error',
			comment: 'frontend は backend/presentation（composition）のみ参照可',
			from: { path: '(src/app/|src/frontend/)' },
			to: {
				path: 'src/backend/',
				pathNot: 'src/backend/presentation/',
			},
		},
	],
	options: {
		doNotFollow: {
			path: ['node_modules'],
		},
		tsPreCompilationDeps: true,
		tsConfig: {
			fileName: './tsconfig.json',
		},
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default'],
		},
		reporterOptions: {
			text: {
				highlightFocused: true,
			},
		},
	},
};
