const Sequelize = require('sequelize');

class Study extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    comment: 'study index',
                },
                study_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: '(0008,0020) DA StudyDate',
                },
                patient_id: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: '(0010,0020) LO PatientID',
                },
                patient_name: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: '(0010,0010) PN PatientName',
                },
                patient_birthdate: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: '(0010,0030) DA PatientBirthDate',
                },
                patient_sex: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: '(0010,0040) CS PatientSex',
                },
                study_description: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: '(0008,1030) LO StudyDescription',
                },
                study_instance_uid: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: '(0020,000D) UI StudyInstanceUID',
                },
                is_cmove: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                    comment: 'cmove 유무',
                },
                is_error: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                    comment: 'cmove 과정 에러 유무',
                },
            },
            {
                sequelize,
                timestamps: true, // true로 해놓으면 createdAt, updatedAt 자동추가
                underscored: true, // true면 created_at  // false면 createdAt
                modelName: 'Study', // sequelize의 모델 이름
                tableName: 'study', // mysql의 테이블 이름
                paranoid: false, // true면 삭제 날짜 기록 (e.g.회원탈퇴 후 1년간 보관한다는 약정 있는 경우 사용)
                charset: 'utf8', // 언어셋  // utf8 해줘야 한글 사용 가능  // utf8mb4는 이모티콘까지 가능
                collate: 'utf8_general_ci', // utf8_general_ci  // utf8mb4_general_ci
            },
        );
    }
}

module.exports = Study;
