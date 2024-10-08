import os
import pydicom
import numpy as np
import sys
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# input_path = os.getenv('INPUT_PATH', '/workspace/colon_test/sample')  # 환경 변수 사용

def convert_dicom_to_jpeg(input_path, save_path, patient_id, study_date, birth_date, age, sex):
    try:
        dcm_file_list = [f for f in os.listdir(input_path) if f.endswith('.dcm')]
        dataset_list=[]

        for index, dcm_name in enumerate(dcm_file_list):
            dcm_file_path = os.path.join(input_path, dcm_name)
            dataset = pydicom.dcmread(dcm_file_path)
            dataset_list.append((dataset.ContentTime, dataset))

        dataset_list.sort(key=lambda x: x[0])

        for index, (_, dataset) in enumerate(dataset_list):
            dataset.PhotometricInterpretation = 'ARGB'
            raws = dataset.Rows
            columns = dataset.Columns
            samples_per_pixel = dataset.SamplesPerPixel
            image_array = np.frombuffer(dataset.pixel_array, dtype=np.uint8).reshape(raws, columns, samples_per_pixel)

            image = Image.fromarray(image_array)
            image.save(f'{save_path}/{patient_id}_{study_date}_{birth_date}_{age}_{sex}_{str(index + 1).zfill(4)}.jpg', 'JPEG', quality=100)

         # input_path의 모든 파일 삭제
        for f in os.listdir(input_path):
            if f.endswith('.dcm'):
                os.remove(os.path.join(input_path, f))
        return 'Success'
    except Exception as e:
        return f'Failed, {str(e)}'


if __name__ == "__main__":
    # 커맨드라인 인자로 patient_id와 study_date를 받음
    input_path = sys.argv[1]
    save_path = sys.argv[2]
    patient_id = sys.argv[3]
    study_date = sys.argv[4]
    birth_date = sys.argv[5]
    age = sys.argv[6]
    sex = sys.argv[7]

    
    result = convert_dicom_to_jpeg(input_path, save_path, patient_id, study_date, birth_date, age, sex)
    print(result)  # 결과 출력