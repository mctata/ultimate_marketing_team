"""
Unit tests for the Privacy Impact Assessment Service.

These tests validate that the PrivacyImpactAssessmentService correctly manages
privacy impact assessments for features and products.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from src.core.compliance import PrivacyImpactAssessmentService
from src.models.compliance import PrivacyImpactAssessment


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock(spec=Session)
    
    # Set up query mock objects
    db.query.return_value = db.query
    db.query.filter.return_value = db.query
    db.query.order_by.return_value = db.query
    db.query.all.return_value = []
    db.query.first.return_value = None
    
    return db


@pytest.fixture
def assessment_service(mock_db):
    """Create PrivacyImpactAssessmentService with mock db."""
    return PrivacyImpactAssessmentService(mock_db)


@pytest.fixture
def sample_assessment():
    """Create a sample privacy impact assessment."""
    return PrivacyImpactAssessment(
        id=1,
        title="Customer Profiling Feature",
        feature_description="AI-powered customer behavior profiling",
        data_collected=[
            {"category": "demographics", "purpose": "segmentation"},
            {"category": "behavior", "purpose": "personalization"}
        ],
        data_use="Customer segmentation and personalized marketing",
        data_sharing="Third-party analytics providers",
        risks_identified=[
            {"risk": "Re-identification risk", "likelihood": "medium", "impact": "high"},
            {"risk": "Data breach", "likelihood": "low", "impact": "high"}
        ],
        mitigations=[
            {"risk": "Re-identification risk", "mitigation": "Data anonymization"},
            {"risk": "Data breach", "mitigation": "Encryption and access controls"}
        ],
        status="draft",
        created_by=1,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestPrivacyImpactAssessmentService:
    """Tests for PrivacyImpactAssessmentService."""
    
    def test_create_assessment(self, assessment_service, mock_db):
        """Test creating a new privacy impact assessment."""
        # Act
        assessment = assessment_service.create_assessment(
            title="Customer Profiling Feature",
            feature_description="AI-powered customer behavior profiling",
            data_collected=[
                {"category": "demographics", "purpose": "segmentation"},
                {"category": "behavior", "purpose": "personalization"}
            ],
            data_use="Customer segmentation and personalized marketing",
            data_sharing="Third-party analytics providers",
            risks_identified=[
                {"risk": "Re-identification risk", "likelihood": "medium", "impact": "high"},
                {"risk": "Data breach", "likelihood": "low", "impact": "high"}
            ],
            mitigations=[
                {"risk": "Re-identification risk", "mitigation": "Data anonymization"},
                {"risk": "Data breach", "mitigation": "Encryption and access controls"}
            ],
            created_by=1
        )
        
        # Assert
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_get_assessment(self, assessment_service, mock_db, sample_assessment):
        """Test fetching a privacy impact assessment by ID."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        
        # Act
        assessment = assessment_service.get_assessment(1)
        
        # Assert
        assert assessment is not None
        assert assessment.id == 1
        assert assessment.title == "Customer Profiling Feature"
        assert assessment.status == "draft"
        mock_db.query.assert_called_once()
    
    def test_get_assessments_all(self, assessment_service, mock_db, sample_assessment):
        """Test fetching all privacy impact assessments."""
        # Arrange
        mock_db.query.return_value.order_by.return_value.all.return_value = [sample_assessment]
        
        # Act
        assessments = assessment_service.get_assessments()
        
        # Assert
        assert len(assessments) == 1
        assert assessments[0].id == 1
        assert assessments[0].title == "Customer Profiling Feature"
        mock_db.query.assert_called_once()
    
    def test_get_assessments_by_status(self, assessment_service, mock_db, sample_assessment):
        """Test fetching assessments filtered by status."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [sample_assessment]
        
        # Act
        assessments = assessment_service.get_assessments(status="draft")
        
        # Assert
        assert len(assessments) == 1
        assert assessments[0].status == "draft"
        mock_db.query.assert_called_once()
    
    def test_get_assessments_by_creator(self, assessment_service, mock_db, sample_assessment):
        """Test fetching assessments filtered by creator."""
        # Arrange
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [sample_assessment]
        
        # Act
        assessments = assessment_service.get_assessments(creator_id=1)
        
        # Assert
        assert len(assessments) == 1
        assert assessments[0].created_by == 1
        mock_db.query.assert_called_once()
    
    def test_update_assessment(self, assessment_service, mock_db, sample_assessment):
        """Test updating a privacy impact assessment."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        
        # Act
        updated_assessment = assessment_service.update_assessment(
            assessment_id=1,
            updates={
                "title": "Updated Customer Profiling Feature",
                "data_use": "Updated data use description",
                "risks_identified": [
                    {"risk": "New risk identified", "likelihood": "high", "impact": "high"}
                ]
            }
        )
        
        # Assert
        assert updated_assessment is not None
        assert updated_assessment.title == "Updated Customer Profiling Feature"
        assert updated_assessment.data_use == "Updated data use description"
        assert updated_assessment.risks_identified[0]["risk"] == "New risk identified"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_assessment_not_found(self, assessment_service, mock_db):
        """Test updating a non-existent assessment."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        updated_assessment = assessment_service.update_assessment(
            assessment_id=999,
            updates={"title": "Updated Title"}
        )
        
        # Assert
        assert updated_assessment is None
        mock_db.commit.assert_not_called()
        mock_db.refresh.assert_not_called()
    
    def test_update_assessment_disallowed_field(self, assessment_service, mock_db, sample_assessment):
        """Test updating a disallowed field doesn't change anything."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        original_status = sample_assessment.status
        
        # Act
        updated_assessment = assessment_service.update_assessment(
            assessment_id=1,
            updates={
                "title": "Updated Title",
                "status": "approved"  # This shouldn't be updated
            }
        )
        
        # Assert
        assert updated_assessment is not None
        assert updated_assessment.title == "Updated Title"
        assert updated_assessment.status == original_status  # Status shouldn't change
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @patch('src.core.compliance.datetime')
    def test_update_assessment_status_approved(self, mock_datetime, assessment_service, mock_db, sample_assessment):
        """Test approving an assessment."""
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        
        # Act
        updated_assessment = assessment_service.update_assessment_status(
            assessment_id=1,
            status="approved",
            reviewer_id=2
        )
        
        # Assert
        assert updated_assessment is not None
        assert updated_assessment.status == "approved"
        assert updated_assessment.reviewer_id == 2
        assert updated_assessment.completed_at == mock_now
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @patch('src.core.compliance.datetime')
    def test_update_assessment_status_rejected(self, mock_datetime, assessment_service, mock_db, sample_assessment):
        """Test rejecting an assessment."""
        # Arrange
        mock_now = datetime.utcnow()
        mock_datetime.utcnow.return_value = mock_now
        
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        
        # Act
        updated_assessment = assessment_service.update_assessment_status(
            assessment_id=1,
            status="rejected",
            reviewer_id=2
        )
        
        # Assert
        assert updated_assessment is not None
        assert updated_assessment.status == "rejected"
        assert updated_assessment.reviewer_id == 2
        assert updated_assessment.completed_at == mock_now
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_assessment_status_review(self, assessment_service, mock_db, sample_assessment):
        """Test setting an assessment to review status."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = sample_assessment
        
        # Act
        updated_assessment = assessment_service.update_assessment_status(
            assessment_id=1,
            status="review"
        )
        
        # Assert
        assert updated_assessment is not None
        assert updated_assessment.status == "review"
        assert updated_assessment.completed_at is None  # Not completed yet
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    def test_update_assessment_status_not_found(self, assessment_service, mock_db):
        """Test updating the status of a non-existent assessment."""
        # Arrange
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        updated_assessment = assessment_service.update_assessment_status(
            assessment_id=999,
            status="approved",
            reviewer_id=2
        )
        
        # Assert
        assert updated_assessment is None
        mock_db.commit.assert_not_called()
        mock_db.refresh.assert_not_called()