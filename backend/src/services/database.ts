import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

// Initialize the SQLite database
const dbPath = path.resolve(__dirname, '../../data.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    branch TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    session_id TEXT,
    status TEXT NOT NULL,
    data_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`);

export interface ProjectRow {
  id: string;
  name: string;
  repo_url: string;
  branch: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvestigationRow {
  id: string;
  project_id: string;
  session_id: string | null;
  status: string;
  data_json: string | null;
  created_at: string;
  updated_at: string;
}

// Prepare statements
const stmts = {
  createProject: db.prepare(`
    INSERT INTO projects (id, name, repo_url, branch, status)
    VALUES (@id, @name, @repo_url, @branch, @status)
  `),
  getProjects: db.prepare('SELECT * FROM projects ORDER BY created_at DESC'),
  getProjectById: db.prepare('SELECT * FROM projects WHERE id = ?'),
  updateProjectStatus: db.prepare(`
    UPDATE projects SET status = @status, updated_at = CURRENT_TIMESTAMP WHERE id = @id
  `),

  createInvestigation: db.prepare(`
    INSERT INTO investigations (id, project_id, session_id, status, data_json)
    VALUES (@id, @project_id, @session_id, @status, @data_json)
  `),
  getInvestigationsByProject: db.prepare('SELECT * FROM investigations WHERE project_id = ? ORDER BY created_at DESC'),
  getInvestigationById: db.prepare('SELECT * FROM investigations WHERE id = ?'),
  updateInvestigation: db.prepare(`
    UPDATE investigations 
    SET session_id = @session_id, status = @status, data_json = @data_json, updated_at = CURRENT_TIMESTAMP 
    WHERE id = @id
  `),
};

// Expose DB interface
export const dbService = {
  createProject: (name: string, repoUrl: string, branch: string = 'main', status: string = 'new') => {
    const id = `prj_${crypto.randomBytes(4).toString('hex')}`;
    stmts.createProject.run({ id, name, repo_url: repoUrl, branch, status });
    return stmts.getProjectById.get(id) as ProjectRow;
  },
  
  getProjects: () => {
    return stmts.getProjects.all() as ProjectRow[];
  },
  
  getProject: (id: string) => {
    return stmts.getProjectById.get(id) as ProjectRow | undefined;
  },

  updateProjectStatus: (id: string, status: string) => {
    stmts.updateProjectStatus.run({ id, status });
  },

  createInvestigation: (projectId: string, sessionId?: string, status: string = 'running', dataJson?: string) => {
    const id = `inv_${crypto.randomBytes(4).toString('hex')}`;
    stmts.createInvestigation.run({ 
      id, 
      project_id: projectId, 
      session_id: sessionId || null, 
      status, 
      data_json: dataJson || null 
    });
    return stmts.getInvestigationById.get(id) as InvestigationRow;
  },

  getInvestigationsByProject: (projectId: string) => {
    return stmts.getInvestigationsByProject.all(projectId) as InvestigationRow[];
  },

  getInvestigation: (id: string) => {
    return stmts.getInvestigationById.get(id) as InvestigationRow | undefined;
  },

  updateInvestigation: (id: string, sessionId: string | null, status: string, dataJson: string | null) => {
    stmts.updateInvestigation.run({ 
      id, 
      session_id: sessionId, 
      status, 
      data_json: dataJson 
    });
    return stmts.getInvestigationById.get(id) as InvestigationRow;
  }
};
