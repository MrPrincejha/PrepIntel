import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

old_ingest = """            payload = {
                "company": req.company.capitalize(),
                "role": req.role,
                "round": req.round,
                "source_type": "user_submission",
                "source_url": req.url,
                "raw_text": refined_text,
                "submitted_by_user_id": req.user_id,
                "status": "pending"
            }"""

new_ingest = """            c_id, r_id = resolve_canonical_ids(req.company, req.role)
            # If company doesn't exist, we should ideally create it or reject.
            # For now, if we can't resolve, we will store the raw name in metadata for manual mapping later.
            
            payload = {
                "company_id": c_id,
                "role_id": r_id,
                # "round_id" requires resolving too. We will just store the string in metadata if unresolved.
                "source_type": "user_submission",
                "source_url": req.url,
                "raw_text": refined_text,
                "submitted_by_user_id": req.user_id,
                "status": "pending",
                "metadata": {"raw_company": req.company, "raw_role": req.role, "raw_round": req.round}
            }"""

m_content = m_content.replace(old_ingest, new_ingest)
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
