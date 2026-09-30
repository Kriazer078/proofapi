use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;

// Solana Playground replaces this with the deployed program id on Build.
declare_id!("5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU");

#[program]
pub mod proof_registry {
    use super::*;

    pub fn register_issuer(ctx: Context<RegisterIssuer>, name: [u8; 32], writer: Pubkey) -> Result<()> {
        require!(name[0] != 0, ProofError::EmptyName);
        let issuer = &mut ctx.accounts.issuer;
        issuer.authority = ctx.accounts.authority.key();
        issuer.writer = writer;
        issuer.name = name;
        issuer.active = true;
        issuer.proof_count = 0;
        issuer.last_record_hash = [0u8; 32];
        issuer.created_at = Clock::get()?.unix_timestamp;
        issuer.bump = ctx.bumps.issuer;
        emit!(IssuerRegistered { issuer: issuer.key(), authority: issuer.authority, writer });
        Ok(())
    }

    pub fn set_writer(ctx: Context<ManageIssuer>, new_writer: Pubkey) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer;
        emit!(WriterChanged { issuer: issuer.key(), old_writer: issuer.writer, new_writer });
        issuer.writer = new_writer;
        Ok(())
    }

    pub fn set_active(ctx: Context<ManageIssuer>, active: bool) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer;
        issuer.active = active;
        emit!(ActiveChanged { issuer: issuer.key(), active });
        Ok(())
    }

    pub fn create_proof(
        ctx: Context<CreateProof>,
        proof_id: [u8; 16],
        input_hash: [u8; 32],
        output_hash: [u8; 32],
        metadata_hash: [u8; 32],
    ) -> Result<()> {
        let issuer_key = ctx.accounts.issuer.key();
        let issuer = &mut ctx.accounts.issuer;
        require!(issuer.active, ProofError::IssuerInactive);

        let sequence = issuer.proof_count;
        let prev_record_hash = issuer.last_record_hash;
        let timestamp = Clock::get()?.unix_timestamp;
        let record_hash = hashv(&[
            b"proofapi-v1",
            issuer_key.as_ref(),
            &sequence.to_le_bytes(),
            &proof_id,
            &input_hash,
            &output_hash,
            &metadata_hash,
            &prev_record_hash,
            &timestamp.to_le_bytes(),
        ])
        .to_bytes();

        let record = &mut ctx.accounts.proof;
        record.issuer = issuer_key;
        record.sequence = sequence;
        record.proof_id = proof_id;
        record.input_hash = input_hash;
        record.output_hash = output_hash;
        record.metadata_hash = metadata_hash;
        record.prev_record_hash = prev_record_hash;
        record.record_hash = record_hash;
        record.timestamp = timestamp;
        record.bump = ctx.bumps.proof;

        issuer.proof_count = sequence.checked_add(1).ok_or(ProofError::Overflow)?;
        issuer.last_record_hash = record_hash;

        emit!(ProofCreated { issuer: issuer_key, sequence, proof_id, record_hash, timestamp });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterIssuer<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Issuer::INIT_SPACE,
        seeds = [b"issuer", authority.key().as_ref()],
        bump
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageIssuer<'info> {
    #[account(
        mut,
        seeds = [b"issuer", authority.key().as_ref()],
        bump = issuer.bump,
        has_one = authority
    )]
    pub issuer: Account<'info, Issuer>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateProof<'info> {
    #[account(
        mut,
        seeds = [b"issuer", issuer.authority.as_ref()],
        bump = issuer.bump,
        has_one = writer @ ProofError::UnauthorizedWriter
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(
        init,
        payer = writer,
        space = 8 + ProofRecord::INIT_SPACE,
        seeds = [b"proof", issuer.key().as_ref(), &issuer.proof_count.to_le_bytes()],
        bump
    )]
    pub proof: Account<'info, ProofRecord>,
    #[account(mut)]
    pub writer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Issuer {
    pub authority: Pubkey,
    pub writer: Pubkey,
    pub name: [u8; 32],
    pub active: bool,
    pub proof_count: u64,
    pub last_record_hash: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ProofRecord {
    pub issuer: Pubkey,
    pub sequence: u64,
    pub proof_id: [u8; 16],
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub metadata_hash: [u8; 32],
    pub prev_record_hash: [u8; 32],
    pub record_hash: [u8; 32],
    pub timestamp: i64,
    pub bump: u8,
}

#[event]
pub struct IssuerRegistered {
    pub issuer: Pubkey,
    pub authority: Pubkey,
    pub writer: Pubkey,
}

#[event]
pub struct WriterChanged {
    pub issuer: Pubkey,
    pub old_writer: Pubkey,
    pub new_writer: Pubkey,
}

#[event]
pub struct ActiveChanged {
    pub issuer: Pubkey,
    pub active: bool,
}

#[event]
pub struct ProofCreated {
    pub issuer: Pubkey,
    pub sequence: u64,
    pub proof_id: [u8; 16],
    pub record_hash: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum ProofError {
    #[msg("Issuer is inactive")]
    IssuerInactive,
    #[msg("Signer is not the issuer's writer")]
    UnauthorizedWriter,
    #[msg("Issuer name must not be empty")]
    EmptyName,
    #[msg("Sequence overflow")]
    Overflow,
}
