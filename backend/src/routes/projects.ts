import { Request, Response, Router } from 'express';
import { dbService } from '../services/database';

const router = Router();

function projectIdFrom(req: Request): string | null {
  const { id } = req.params;
  return typeof id === "string" && id.length > 0 ? id : null;
}

// GET all projects
router.get('/', (req: Request, res: Response) => {
  try {
    const projects = dbService.getProjects();
    
    // Enrich projects with latest investigation
    const enrichedProjects = projects.map(p => {
      const investigations = dbService.getInvestigationsByProject(p.id);
      const latest = investigations[0]; // ordered by created_at DESC
      
      let parsedData = null;
      if (latest && latest.data_json) {
        try {
          parsedData = JSON.parse(latest.data_json);
        } catch (e) {
          // ignore parsing error
        }
      }

      return {
        ...p,
        latestInvestigation: latest ? {
          id: latest.id,
          status: latest.status,
          session_id: latest.session_id,
          time: latest.created_at,
          ...parsedData
        } : null,
        lastActivity: latest ? `Investigation ${latest.status}` : 'Project added'
      };
    });

    res.json({ projects: enrichedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST create project
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, repoUrl, branch } = req.body;
    if (!name || !repoUrl) {
      return res.status(400).json({ error: 'Name and repoUrl are required' });
    }
    
    const project = dbService.createProject(name, repoUrl, branch || 'main');
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET single project
router.get('/:id', (req: Request, res: Response) => {
  try {
    const projectId = projectIdFrom(req);
    if (!projectId) return res.status(400).json({ error: 'Project id is required' });
    const project = dbService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// GET project investigations
router.get('/:id/investigations', (req: Request, res: Response) => {
  try {
    const projectId = projectIdFrom(req);
    if (!projectId) return res.status(400).json({ error: 'Project id is required' });
    const investigations = dbService.getInvestigationsByProject(projectId);
    const parsed = investigations.map(inv => {
      let parsedData = null;
      if (inv.data_json) {
        try { parsedData = JSON.parse(inv.data_json); } catch (e) {}
      }
      return { ...inv, data: parsedData };
    });
    res.json({ investigations: parsed });
  } catch (error) {
    console.error('Error fetching investigations:', error);
    res.status(500).json({ error: 'Failed to fetch investigations' });
  }
});

// POST create investigation
router.post('/:id/investigations', (req: Request, res: Response) => {
  try {
    const projectId = projectIdFrom(req);
    if (!projectId) return res.status(400).json({ error: 'Project id is required' });
    const { sessionId, status, dataJson } = req.body;
    const project = dbService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const investigation = dbService.createInvestigation(
      projectId, 
      sessionId, 
      status || 'running', 
      dataJson ? JSON.stringify(dataJson) : undefined
    );
    
    // Update project status
    dbService.updateProjectStatus(projectId, 'investigating');
    
    res.status(201).json(investigation);
  } catch (error) {
    console.error('Error creating investigation:', error);
    res.status(500).json({ error: 'Failed to create investigation' });
  }
});

export default router;
