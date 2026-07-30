import { useState } from 'react'
import { Link } from 'react-router-dom'

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  const days = Math.floor(seconds / 86400)

  if (days === 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  if (days < 7) return `Posted ${days} days ago`
  if (days < 30) return `Posted ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `Posted ${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

const DESCRIPTION_LIMIT = 180

export default function OpportunityCard({ opportunity, applicantCount, ngoPostCount }) {
  const [expanded, setExpanded] = useState(false)

  const isLong = opportunity.description.length > DESCRIPTION_LIMIT
  const shownDescription =
    expanded || !isLong
      ? opportunity.description
      : opportunity.description.slice(0, DESCRIPTION_LIMIT).trim() + '…'

  const isVerified = opportunity.ngo_details?.verified

  return (
    <div className="card">
      <div className="opp-card-header">
        <h2>{opportunity.title}</h2>
        <span className="opp-posted">{timeAgo(opportunity.created_at)}</span>
      </div>

      <p className="opp-meta-line">
        <strong>{opportunity.location_type === 'remote' ? 'Remote' : 'In person'}</strong>
        {' · '}
        {opportunity.cause_areas?.name}
        {' · '}
        {opportunity.time_commitment}
        {applicantCount !== undefined && (
          <> · {applicantCount} applicant{applicantCount === 1 ? '' : 's'} so far</>
        )}
      </p>

      <p className="opp-description-full">{shownDescription}</p>
      {isLong && (
        <button type="button" className="show-more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {opportunity.opportunity_skills?.length > 0 && (
        <div className="opp-tags-row">
          {opportunity.opportunity_skills.map((os) => (
            <span key={os.skills.name} className="tag tag-skill">{os.skills.name}</span>
          ))}
        </div>
      )}

      <div className="opp-footer">
        <span className={`opp-footer-item ${isVerified ? 'verified-badge' : ''}`}>
          {opportunity.ngo_details?.org_name}
          {!isVerified && ' (unverified)'}
        </span>
        {opportunity.ngo_details?.country && (
          <span className="opp-footer-item">{opportunity.ngo_details.country}</span>
        )}
        {ngoPostCount !== undefined && (
          <span className="opp-footer-item">
            {ngoPostCount} opportunit{ngoPostCount === 1 ? 'y' : 'ies'} posted
          </span>
        )}
      </div>

      <Link to={`/opportunities/${opportunity.id}`} className="view-details-link">View details →</Link>
    </div>
  )
}