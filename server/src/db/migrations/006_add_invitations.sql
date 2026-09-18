CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID NOT NULL
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    invited_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    email TEXT NOT NULL,

    token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_workspace_id
ON invitations(workspace_id);

CREATE INDEX idx_invitations_email
ON invitations(email);

CREATE INDEX idx_invitations_token
ON invitations(token);
