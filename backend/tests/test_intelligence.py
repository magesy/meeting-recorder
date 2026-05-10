import pytest
from unittest.mock import MagicMock, patch
from backend.services.intelligence import generate_mom

@patch("google.generativeai.GenerativeModel")
@patch("google.generativeai.configure")
def test_generate_mom_success(mock_configure, mock_model_class):
    # Setup mock
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    
    mock_response = MagicMock()
    mock_response.text = "This is a mock Minutes of Meeting."
    mock_model_instance.generate_content.return_value = mock_response
    
    transcript = "Hello, welcome to the meeting. We decided to launch the product next week."
    result = generate_mom(transcript)
    
    assert result == "This is a mock Minutes of Meeting."
    mock_configure.assert_called_once()
    mock_model_class.assert_called_with("gemini-1.5-pro")
    mock_model_instance.generate_content.assert_called_once()
    
    # Check if prompt contains transcript
    args, kwargs = mock_model_instance.generate_content.call_args
    prompt = args[0]
    assert transcript in prompt
    assert "Minutes of Meeting" in prompt
    assert "Thai and English" in prompt

@patch("google.generativeai.GenerativeModel")
def test_generate_mom_api_error(mock_model_class):
    # Setup mock to raise an exception
    mock_model_instance = MagicMock()
    mock_model_class.return_value = mock_model_instance
    mock_model_instance.generate_content.side_effect = Exception("API Key Error")
    
    with pytest.raises(Exception) as excinfo:
        generate_mom("Some transcript")
    
    assert "API Key Error" in str(excinfo.value)
